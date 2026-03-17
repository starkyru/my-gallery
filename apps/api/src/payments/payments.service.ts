import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { ImagesService } from '../images/images.service';
import { ServicesService } from '../services/services.service';
import { PaymentRegistryService } from '../services/providers/payment-registry.service';
import { FulfillmentRegistryService } from '../services/providers/fulfillment-registry.service';
import { OrderStatus, OrderItemType } from '@gallery/shared';
import { OrderEntity } from '../orders/order.entity';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly ordersService: OrdersService,
    private readonly imagesService: ImagesService,
    private readonly servicesService: ServicesService,
    private readonly paymentRegistry: PaymentRegistryService,
    private readonly fulfillmentRegistry: FulfillmentRegistryService,
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

        const incremented = await this.imagesService.incrementPrintsSold(
          image.id,
          image.printLimit,
        );
        if (!incremented) {
          this.logger.error(`Print edition sold out for image ${image.id}, order ${order.id}`);
          continue;
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
