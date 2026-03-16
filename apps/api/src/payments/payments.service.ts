import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from '../orders/orders.service';
import { ImagesService } from '../images/images.service';
import { ProdigiService } from '../prodigi/prodigi.service';
import { OrderStatus, PaymentMethod, OrderItemType } from '@gallery/shared';
import { OrderEntity } from '../orders/order.entity';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
    private readonly imagesService: ImagesService,
    private readonly prodigiService: ProdigiService,
  ) {}

  async createBtcPayInvoice(orderId: number) {
    const order = await this.ordersService.findOne(orderId);
    const btcpayUrl = this.configService.get('BTCPAY_URL');
    const apiKey = this.configService.get('BTCPAY_API_KEY');
    const storeId = this.configService.get('BTCPAY_STORE_ID');

    const response = await fetch(`${btcpayUrl}/api/v1/stores/${storeId}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${apiKey}`,
      },
      body: JSON.stringify({
        amount: order.total,
        currency: 'USD',
        metadata: { orderId: order.id },
        checkout: {
          redirectURL: `${this.configService.get('PUBLIC_URL')}/orders/${order.id}/success`,
        },
      }),
    });

    const invoice = await response.json();
    await this.ordersService.updateStatus(
      orderId,
      OrderStatus.Pending,
      invoice.id,
      PaymentMethod.BTCPay,
    );

    return { invoiceId: invoice.id, checkoutLink: invoice.checkoutLink };
  }

  async handleBtcPayWebhook(payload: any) {
    if (payload.type === 'InvoiceSettled') {
      const orderId = payload.metadata?.orderId;
      if (orderId) {
        await this.ordersService.updateStatus(orderId, OrderStatus.Paid);
        const order = await this.ordersService.findOne(orderId);
        await this.fulfillPrintItems(order);
      }
    }
  }

  async createPayPalOrder(orderId: number) {
    const order = await this.ordersService.findOne(orderId);
    const clientId = this.configService.get('PAYPAL_CLIENT_ID');
    const secret = this.configService.get('PAYPAL_CLIENT_SECRET');
    const baseUrl =
      this.configService.get('NODE_ENV') === 'production'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';

    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    const { access_token } = await authResponse.json();

    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: { currency_code: 'USD', value: order.total.toString() },
            reference_id: order.id.toString(),
          },
        ],
      }),
    });

    const paypalOrder = await response.json();
    await this.ordersService.updateStatus(
      orderId,
      OrderStatus.Pending,
      paypalOrder.id,
      PaymentMethod.PayPal,
    );

    return { paypalOrderId: paypalOrder.id };
  }

  async capturePayPalOrder(orderId: number, paypalOrderId: string) {
    const clientId = this.configService.get('PAYPAL_CLIENT_ID');
    const secret = this.configService.get('PAYPAL_CLIENT_SECRET');
    const baseUrl =
      this.configService.get('NODE_ENV') === 'production'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';

    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    const { access_token } = await authResponse.json();

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
    });

    const result = await response.json();
    if (result.status === 'COMPLETED') {
      await this.ordersService.updateStatus(orderId, OrderStatus.Paid);
      const order = await this.ordersService.findOne(orderId);
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

        const prodigiResult = await this.prodigiService.createOrder(
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

        await this.ordersService.updateItemProdigiOrderId(item.id, prodigiResult.id);
        this.logger.log(`Prodigi order ${prodigiResult.id} created for order item ${item.id}`);
      } catch (error) {
        this.logger.error(`Failed to fulfill print item ${item.id} for order ${order.id}`, error);
      }
    }
  }
}
