import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentProvider,
  PaymentResult,
  CaptureResult,
  WebhookResult,
  CredentialField,
} from './payment-provider.interface';
import { SettingsField } from './payment-provider.interface';

@Injectable()
export class PayPalProvider implements PaymentProvider {
  private readonly logger = new Logger(PayPalProvider.name);

  readonly name = 'paypal';

  readonly credentialSchema: CredentialField[] = [
    { key: 'clientId', label: 'Client ID', type: 'text' },
    { key: 'clientSecret', label: 'Client Secret', type: 'password' },
    { key: 'webhookId', label: 'Webhook ID', type: 'text' },
  ];

  readonly settingsSchema: SettingsField[] = [
    { key: 'sandbox', label: 'Sandbox Mode', type: 'boolean', default: true },
  ];

  private getBaseUrl(settings: Record<string, unknown>): string {
    return settings.sandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
  }

  private async getAccessToken(
    credentials: Record<string, string>,
    settings: Record<string, unknown>,
  ): Promise<string> {
    const baseUrl = this.getBaseUrl(settings);
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    const { access_token } = await authResponse.json();
    return access_token;
  }

  async createPayment(
    order: { id: number; total: number },
    credentials: Record<string, string>,
    settings: Record<string, unknown>,
  ): Promise<PaymentResult> {
    const baseUrl = this.getBaseUrl(settings);
    const accessToken = await this.getAccessToken(credentials, settings);

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
    credentials: Record<string, string>,
    settings: Record<string, unknown>,
  ): Promise<CaptureResult> {
    const baseUrl = this.getBaseUrl(settings);
    const accessToken = await this.getAccessToken(credentials, settings);

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

  async handleWebhook(
    _payload: Record<string, unknown>,
    _credentials: Record<string, string>,
    _settings: Record<string, unknown>,
  ): Promise<WebhookResult> {
    // PayPal webhooks are not currently used — capture is done client-side
    return {};
  }
}
