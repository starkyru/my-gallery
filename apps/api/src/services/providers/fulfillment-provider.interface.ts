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
  readonly configHint?: string;
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
  handleWebhook(
    payload: unknown,
    rawBody?: Buffer,
    headers?: Record<string, string>,
  ): Promise<FulfillmentWebhookResult>;
}
