import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentProvider,
  PaymentResult,
  CaptureResult,
  WebhookResult,
} from '../payment-provider.interface';
import { loadProviderEnv } from '../load-env';

@Injectable()
export class PayPalProvider implements PaymentProvider {
  private readonly logger = new Logger(PayPalProvider.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly webhookId: string;
  private readonly sandbox: boolean;

  readonly name = 'paypal';

  constructor() {
    const env = loadProviderEnv(__dirname);
    this.clientId = env.PAYPAL_CLIENT_ID || '';
    this.clientSecret = env.PAYPAL_CLIENT_SECRET || '';
    this.webhookId = env.PAYPAL_WEBHOOK_ID || '';
    this.sandbox = env.PAYPAL_SANDBOX !== 'false';
  }

  get configured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  get configHint(): string | undefined {
    if (this.configured) return undefined;
    const missing = [
      !this.clientId && 'PAYPAL_CLIENT_ID',
      !this.clientSecret && 'PAYPAL_CLIENT_SECRET',
    ].filter(Boolean);
    return `Missing: ${missing.join(', ')}`;
  }

  private getBaseUrl(): string {
    return this.sandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
  }

  private async getAccessToken(): Promise<string> {
    const baseUrl = this.getBaseUrl();
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    const { access_token } = await authResponse.json();
    return access_token;
  }

  async createPayment(order: { id: number; total: number }): Promise<PaymentResult> {
    const baseUrl = this.getBaseUrl();
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
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
    if (!response.ok) {
      this.logger.error('PayPal order creation failed', paypalOrder);
      throw new Error(`PayPal error: ${paypalOrder.message || response.statusText}`);
    }

    return { paymentId: paypalOrder.id };
  }

  async capturePayment(
    _orderId: number,
    captureData: Record<string, unknown>,
  ): Promise<CaptureResult> {
    const baseUrl = this.getBaseUrl();
    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `${baseUrl}/v2/checkout/orders/${captureData.paypalOrderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const result = await response.json();
    return result;
  }

  async handleWebhook(_payload: Record<string, unknown>): Promise<WebhookResult> {
    return {};
  }
}
