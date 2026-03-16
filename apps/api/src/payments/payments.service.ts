import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus, PaymentMethod } from '@gallery/shared';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
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
    }

    return result;
  }
}
