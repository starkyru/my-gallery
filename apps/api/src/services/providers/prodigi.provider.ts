import { Injectable, Logger } from '@nestjs/common';
import {
  FulfillmentProvider,
  FulfillmentResult,
  FulfillmentWebhookResult,
} from './fulfillment-provider.interface';
import { CredentialField, SettingsField } from './payment-provider.interface';

@Injectable()
export class ProdigiProvider implements FulfillmentProvider {
  private readonly logger = new Logger(ProdigiProvider.name);

  readonly name = 'prodigi';

  readonly credentialSchema: CredentialField[] = [
    { key: 'apiKey', label: 'API Key', type: 'password' },
  ];

  readonly settingsSchema: SettingsField[] = [
    { key: 'sandbox', label: 'Sandbox Mode', type: 'boolean', default: true },
  ];

  private getBaseUrl(settings: Record<string, any>): string {
    return settings.sandbox ? 'https://api.sandbox.prodigi.com' : 'https://api.prodigi.com';
  }

  async createFulfillmentOrder(
    imageUrl: string,
    sku: string,
    shippingAddress: {
      name: string;
      address1: string;
      address2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    },
    reference: string,
    credentials: Record<string, string>,
    settings: Record<string, any>,
  ): Promise<FulfillmentResult> {
    const baseUrl = this.getBaseUrl(settings);

    const response = await fetch(`${baseUrl}/v4.0/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': credentials.apiKey,
      },
      body: JSON.stringify({
        merchantReference: reference,
        shippingMethod: 'Standard',
        recipient: {
          name: shippingAddress.name,
          address: {
            line1: shippingAddress.address1,
            line2: shippingAddress.address2 || '',
            postalOrZipCode: shippingAddress.postalCode,
            townOrCity: shippingAddress.city,
            stateOrCounty: shippingAddress.state,
            countryCode: shippingAddress.country,
          },
        },
        items: [
          {
            merchantReference: reference,
            sku,
            copies: 1,
            sizing: 'fillPrintArea',
            assets: [{ printArea: 'default', url: imageUrl }],
          },
        ],
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      this.logger.error('Prodigi order creation failed', result);
      throw new Error(`Prodigi order failed: ${result.message || response.statusText}`);
    }

    this.logger.log(`Prodigi order created: ${result.order.id}`);
    return { id: result.order.id, status: result.order.status.stage };
  }

  async handleWebhook(
    payload: any,
    _credentials: Record<string, string>,
    _settings: Record<string, any>,
  ): Promise<FulfillmentWebhookResult> {
    this.logger.log(`Prodigi webhook: ${payload.event}`);
    if (payload.event === 'order.status.update') {
      return {
        orderId: payload.order?.id,
        status: payload.order?.status?.stage,
      };
    }
    return {};
  }
}
