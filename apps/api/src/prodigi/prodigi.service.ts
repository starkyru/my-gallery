import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ProdigiSku {
  sku: string;
  description: string;
}

const AVAILABLE_SKUS: ProdigiSku[] = [
  { sku: 'GLOBAL-PHO-8x10-FP', description: '8x10 Fine Art Print' },
  { sku: 'GLOBAL-PHO-11x14-FP', description: '11x14 Fine Art Print' },
  { sku: 'GLOBAL-PHO-16x20-FP', description: '16x20 Fine Art Print' },
  { sku: 'GLOBAL-PHO-24x36-FP', description: '24x36 Fine Art Print' },
  { sku: 'GLOBAL-CAN-16x20', description: '16x20 Canvas' },
];

@Injectable()
export class ProdigiService {
  private readonly logger = new Logger(ProdigiService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get('PRODIGI_API_KEY', '');
    const sandbox = this.configService.get('PRODIGI_SANDBOX', 'true') === 'true';
    this.baseUrl = sandbox ? 'https://api.sandbox.prodigi.com' : 'https://api.prodigi.com';
  }

  getAvailableSkus(): ProdigiSku[] {
    return AVAILABLE_SKUS;
  }

  async createOrder(
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
  ): Promise<{ id: string; status: string }> {
    const response = await fetch(`${this.baseUrl}/v4.0/orders`, {
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

  async handleWebhook(payload: any): Promise<{ orderId?: string; status?: string }> {
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
