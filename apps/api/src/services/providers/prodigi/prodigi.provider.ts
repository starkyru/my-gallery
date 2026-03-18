import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FulfillmentProvider,
  FulfillmentResult,
  FulfillmentWebhookResult,
} from '../fulfillment-provider.interface';
import { loadProviderEnv } from '../load-env';
import { ServiceConfigEntity } from '../../service-config.entity';
import { ProdigiOrderResponse, ProdigiWebhookPayload } from './prodigi.types';

@Injectable()
export class ProdigiProvider implements FulfillmentProvider {
  private readonly logger = new Logger(ProdigiProvider.name);
  private readonly apiKey: string;

  readonly name = 'prodigi';

  constructor(
    @InjectRepository(ServiceConfigEntity)
    private readonly configRepo: Repository<ServiceConfigEntity>,
  ) {
    const env = loadProviderEnv(__dirname);
    this.apiKey = env.PRODIGI_API_KEY || '';
  }

  get configured(): boolean {
    return !!this.apiKey;
  }

  private async getBaseUrl(): Promise<string> {
    const config = await this.configRepo.findOne({ where: { provider: 'prodigi' } });
    const sandbox = config?.sandbox ?? true;
    return sandbox ? 'https://api.sandbox.prodigi.com' : 'https://api.prodigi.com';
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
    const baseUrl = await this.getBaseUrl();

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

    const result: ProdigiOrderResponse = await response.json();
    if (!response.ok) {
      this.logger.error('Prodigi order creation failed', result);
      throw new Error(`Prodigi order failed: ${response.statusText}`);
    }

    this.logger.log(`Prodigi order created: ${result.order.id}`);
    return { id: result.order.id, status: result.order.status.stage };
  }

  async handleWebhook(payload: ProdigiWebhookPayload): Promise<FulfillmentWebhookResult> {
    this.logger.log(`Prodigi webhook: ${payload.event}`);
    if (payload.event === 'order.status.update') {
      return {
        orderId: payload.order.id,
        status: payload.order.status.stage,
      };
    }
    return {};
  }
}
