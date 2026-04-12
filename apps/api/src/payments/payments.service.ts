import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { ImagesService } from '../images/images.service';
import { ServicesService } from '../services/services.service';
import { PaymentRegistryService } from '../services/providers/payment-registry.service';
import { FulfillmentRegistryService } from '../services/providers/fulfillment-registry.service';
import { OrderStatus, OrderItemType } from '@gallery/shared';
import { OrderEntity } from '../orders/order.entity';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly ordersService: OrdersService,
    private readonly imagesService: ImagesService,
    private readonly servicesService: ServicesService,
    private readonly paymentRegistry: PaymentRegistryService,
    private readonly fulfillmentRegistry: FulfillmentRegistryService,
    private readonly authService: AuthService,
  ) {}

  async createPayment(orderId: number, providerName: string) {
    const order = await this.ordersService.findOne(orderId);
    await this.servicesService.getEnabledConfig('payment', providerName);
    const provider = this.paymentRegistry.get(providerName);
    if (!provider) throw new NotFoundException(`Payment provider not found: ${providerName}`);

    const result = await provider.createPayment(order);

    await this.ordersService.updateStatus(
      orderId,
      OrderStatus.Pending,
      result.paymentId,
      providerName,
    );

    return result;
  }

  async capturePayment(
    orderId: number,
    providerName: string,
    captureData: Record<string, unknown>,
  ) {
    const order = await this.ordersService.findOne(orderId);
    const paypalOrderId = captureData.paypalOrderId as string | undefined;
    if (paypalOrderId && order.paymentId && order.paymentId !== paypalOrderId) {
      throw new BadRequestException('Payment ID mismatch');
    }

    await this.servicesService.getEnabledConfig('payment', providerName);
    const provider = this.paymentRegistry.get(providerName);
    if (!provider?.capturePayment) {
      throw new NotFoundException(`Capture not supported for provider: ${providerName}`);
    }

    const result = await provider.capturePayment(orderId, captureData);

    if (result.status === 'COMPLETED') {
      await this.ordersService.updateStatus(orderId, OrderStatus.Paid);
      const order = await this.ordersService.findOne(orderId);
      await this.fulfillPrintItems(order);
      await this.markPhysicalOriginalsSold(order);
      this.notifyAdminsOfOrder(order).catch((err) =>
        this.logger.error('Failed to send order notification emails', err),
      );
    }

    return result;
  }

  async handleWebhook(
    providerName: string,
    payload: Record<string, unknown>,
    rawBody?: Buffer,
    headers?: Record<string, string>,
  ) {
    await this.servicesService.getEnabledConfig('payment', providerName);
    const provider = this.paymentRegistry.get(providerName);
    if (!provider) throw new NotFoundException(`Payment provider not found: ${providerName}`);

    const result = await provider.handleWebhook(payload, rawBody, headers);

    if (result.paid && result.orderId) {
      await this.ordersService.updateStatus(result.orderId, OrderStatus.Paid);
      const order = await this.ordersService.findOne(result.orderId);
      await this.fulfillPrintItems(order);
      await this.markPhysicalOriginalsSold(order);
      this.notifyAdminsOfOrder(order).catch((err) =>
        this.logger.error('Failed to send order notification emails', err),
      );
    }

    return result;
  }

  private async fulfillPrintItems(order: OrderEntity) {
    const printItems = order.items.filter((item) => item.type === OrderItemType.Print);
    if (printItems.length === 0) return;

    if (!order.shippingName || !order.shippingAddress1) {
      this.logger.warn(`Order ${order.id} has print items but no shipping address`);
      return;
    }

    const fulfillmentConfigs = await this.servicesService.getEnabledByType('fulfillment');

    for (const item of printItems) {
      try {
        const image = await this.imagesService.findOne(item.imageId);

        if (image.perOptionLimits) {
          const option = await this.imagesService.findPrintOption(image.id, item.printSku!);
          if (!option) {
            this.logger.error(
              `Print option ${item.printSku} not found for image ${image.id}, order ${order.id}`,
            );
            continue;
          }
          const incremented = await this.imagesService.incrementOptionSoldCount(
            option.id,
            option.printLimit,
          );
          if (!incremented) {
            this.logger.error(
              `Print option ${item.printSku} sold out for image ${image.id}, order ${order.id}`,
            );
            continue;
          }
        } else {
          const incremented = await this.imagesService.incrementPrintsSold(
            image.id,
            image.printLimit,
          );
          if (!incremented) {
            this.logger.error(`Print edition sold out for image ${image.id}, order ${order.id}`);
            continue;
          }
        }

        const imageUrl = this.imagesService.generateDownloadUrl(item.imageId);

        const providerName =
          item.fulfillmentProvider ||
          this.findFulfillmentProvider(item.printSku!, fulfillmentConfigs);
        if (!providerName) {
          this.logger.error(
            `No fulfillment provider found for SKU ${item.printSku}, order ${order.id}`,
          );
          continue;
        }

        const config = fulfillmentConfigs.find((c) => c.provider === providerName);
        if (!config) {
          this.logger.error(`Fulfillment provider ${providerName} not enabled, order ${order.id}`);
          continue;
        }

        const provider = this.fulfillmentRegistry.get(providerName);
        if (!provider) {
          this.logger.error(`Fulfillment provider ${providerName} not registered`);
          continue;
        }

        const result = await provider.createFulfillmentOrder(
          imageUrl,
          item.printSku!,
          {
            name: order.shippingName,
            address1: order.shippingAddress1!,
            address2: order.shippingAddress2 || undefined,
            city: order.shippingCity!,
            state: order.shippingState!,
            postalCode: order.shippingPostalCode!,
            country: order.shippingCountry!,
          },
          `order-${order.id}-item-${item.id}`,
        );

        await this.ordersService.updateItemFulfillment(item.id, result.id, providerName);
        this.logger.log(`${providerName} order ${result.id} created for order item ${item.id}`);
      } catch (error) {
        this.logger.error(`Failed to fulfill print item ${item.id} for order ${order.id}`, error);
      }
    }
  }

  private async markPhysicalOriginalsSold(order: OrderEntity) {
    const physicalItems = order.items.filter(
      (item) => item.type === OrderItemType.PhysicalOriginal,
    );
    for (const item of physicalItems) {
      try {
        const sold = await this.imagesService.markOriginalSold(item.imageId);
        if (sold) {
          this.logger.log(
            `Marked image ${item.imageId} as sold (physical original) for order ${order.id}`,
          );
        } else {
          this.logger.error(
            `Image ${item.imageId} was already sold — possible double-sale for order ${order.id}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to mark image ${item.imageId} as sold for order ${order.id}`,
          error,
        );
      }
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private async notifyAdminsOfOrder(order: OrderEntity) {
    const admins = await this.authService.findNotifyAdmins();
    if (admins.length === 0) return;

    const itemRows = order.items
      .map((item) => {
        const type =
          item.type === OrderItemType.Print
            ? `Print (${this.escapeHtml(item.printSku || '')})`
            : item.type === OrderItemType.PhysicalOriginal
              ? 'Physical Original'
              : 'Digital Original';
        return `<tr><td style="padding:4px 8px">#${item.imageId}</td><td style="padding:4px 8px">${type}</td><td style="padding:4px 8px">$${item.price}</td></tr>`;
      })
      .join('');

    const html = `
      <h2>New Order #${order.id}</h2>
      <p><strong>Customer:</strong> ${this.escapeHtml(order.customerEmail)}</p>
      <p><strong>Total:</strong> $${order.total}</p>
      <p><strong>Items:</strong> ${order.items.length}</p>
      <table border="1" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-color:#ddd">
        <tr style="background:#f5f5f5"><th style="padding:4px 8px">Image</th><th style="padding:4px 8px">Type</th><th style="padding:4px 8px">Price</th></tr>
        ${itemRows}
      </table>
    `;

    for (const admin of admins) {
      try {
        await this.authService.sendEmail(admin.email, `New Order #${order.id}`, html);
      } catch (err) {
        this.logger.error(`Failed to notify ${admin.email} about order ${order.id}`, err);
      }
    }
  }

  private findFulfillmentProvider(
    sku: string,
    configs: { provider: string; skus: { sku: string; description: string }[] }[],
  ): string | null {
    for (const config of configs) {
      if (config.skus.some((s) => s.sku === sku)) {
        return config.provider;
      }
    }
    return configs.length > 0 ? configs[0].provider : null;
  }
}
