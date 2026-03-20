import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ProdigiClient,
  ProdigiApiError,
  OrderBuilder,
  type Environment,
  type CallbackEvent,
  type CatalogueListResponse,
  type CatalogueProductDetail,
} from 'prodigi-print-api';
import {
  FulfillmentProvider,
  FulfillmentResult,
  FulfillmentWebhookResult,
} from '../fulfillment-provider.interface';
import { loadProviderEnv } from '../load-env';
import { ServiceConfigEntity } from '../../service-config.entity';

@Injectable()
export class ProdigiProvider implements FulfillmentProvider {
  private readonly logger = new Logger(ProdigiProvider.name);
  private readonly apiKey: string;
  private readonly clientCache = new Map<Environment, ProdigiClient>();

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

  private async getClient(): Promise<ProdigiClient> {
    const config = await this.configRepo.findOne({ where: { provider: 'prodigi' } });
    const environment: Environment = (config?.sandbox ?? true) ? 'sandbox' : 'production';
    const cached = this.clientCache.get(environment);
    if (cached) return cached;
    const client = new ProdigiClient({ apiKey: this.apiKey, environment });
    this.clientCache.set(environment, client);
    return client;
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
    const client = await this.getClient();

    const request = new OrderBuilder()
      .shippingMethod('Standard')
      .merchantReference(reference)
      .recipient({
        name: shippingAddress.name,
        address: {
          line1: shippingAddress.address1,
          line2: shippingAddress.address2 || '',
          postalOrZipCode: shippingAddress.postalCode,
          townOrCity: shippingAddress.city,
          stateOrCounty: shippingAddress.state,
          countryCode: shippingAddress.country,
        },
      })
      .addPrint(sku, imageUrl, { copies: 1, sizing: 'fillPrintArea' })
      .build();

    try {
      const result = await client.orders.create(request);
      this.logger.log(`Prodigi order created: ${result.order.id}`);
      return { id: result.order.id, status: result.order.status.stage };
    } catch (error) {
      if (error instanceof ProdigiApiError) {
        this.logger.error(`Prodigi order creation failed: ${error.message}`, error.data);
      }
      throw new InternalServerErrorException('Fulfillment order creation failed');
    }
  }

  async getCatalogueCategories(): Promise<CatalogueListResponse> {
    const client = await this.getClient();
    return client.catalogue.list();
  }

  async getCatalogueProduct(slug: string): Promise<CatalogueProductDetail> {
    const client = await this.getClient();
    return client.catalogue.get(slug);
  }

  async handleWebhook(payload: CallbackEvent): Promise<FulfillmentWebhookResult> {
    this.logger.log(`Prodigi webhook: ${payload.type}`);
    if (payload.type === 'order.status.update') {
      return {
        orderId: payload.data.id,
        status: payload.data.status.stage,
      };
    }
    return {};
  }
}
