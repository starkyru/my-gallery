export interface FulfillmentResult {
  id: string;
  status: string;
}

export interface FulfillmentWebhookResult {
  orderId?: string;
  status?: string;
}

export interface FulfillmentProvider {
  readonly name: string;
  readonly configured: boolean;
  createFulfillmentOrder(
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
  ): Promise<FulfillmentResult>;
  handleWebhook(payload: unknown): Promise<FulfillmentWebhookResult>;
}
