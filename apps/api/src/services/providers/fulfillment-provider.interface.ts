import { CredentialField, SettingsField } from './payment-provider.interface';

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
  readonly credentialSchema: CredentialField[];
  readonly settingsSchema: SettingsField[];
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
    credentials: Record<string, string>,
    settings: Record<string, unknown>,
  ): Promise<FulfillmentResult>;
  handleWebhook(
    payload: Record<string, unknown>,
    credentials: Record<string, string>,
    settings: Record<string, unknown>,
  ): Promise<FulfillmentWebhookResult>;
}
