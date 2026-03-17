import { Injectable, Logger } from '@nestjs/common';
import {
  FulfillmentProvider,
  FulfillmentResult,
  FulfillmentWebhookResult,
} from '../fulfillment-provider.interface';
import { loadProviderEnv } from '../load-env';

@Injectable()
export class ProdigiProvider implements FulfillmentProvider {
  private readonly logger = new Logger(ProdigiProvider.name);
  private readonly apiKey: string;
  private readonly sandbox: boolean;

  readonly name = 'prodigi';

  constructor() {
    const env = loadProviderEnv(__dirname);
    this.apiKey = env.PRODIGI_API_KEY || '';
    this.sandbox = env.PRODIGI_SANDBOX !== 'false';
  }

  get configured(): boolean {
    return !!this.apiKey;
  }

  private getBaseUrl(): string {
    return this.sandbox ? 'https://api.sandbox.prodigi.com' : 'https://api.prodigi.com';
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
  ): Promise<FulfillmentResult> {
    const baseUrl = this.getBaseUrl();

    const response = await fetch(`${baseUrl}/v4.0/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
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

  async handleWebhook(payload: Record<string, unknown>): Promise<FulfillmentWebhookResult> {
    this.logger.log(`Prodigi webhook: ${payload.event}`);
    if (payload.event === 'order.status.update') {
      const order = payload.order as Record<string, unknown> | undefined;
      const status = order?.status as Record<string, unknown> | undefined;
      return {
        orderId: order?.id as string | undefined,
        status: status?.stage as string | undefined,
      };
    }
    return {};
  }
}
