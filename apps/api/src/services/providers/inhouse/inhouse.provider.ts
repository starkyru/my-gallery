import { Injectable, Logger } from '@nestjs/common';
import {
  FulfillmentProvider,
  FulfillmentResult,
  FulfillmentWebhookResult,
} from '../fulfillment-provider.interface';

@Injectable()
export class InhouseProvider implements FulfillmentProvider {
  private readonly logger = new Logger(InhouseProvider.name);

  readonly name = 'inhouse';
  readonly configured = true;

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
    this.logger.log(
      `Inhouse print order: ${reference}, SKU: ${sku}, ship to: ${shippingAddress.name}, ${shippingAddress.city}, ${shippingAddress.country}`,
    );

    return {
      id: `inhouse-${reference}`,
      status: 'pending_manual',
    };
  }

  async handleWebhook(): Promise<FulfillmentWebhookResult> {
    return {};
  }
}
