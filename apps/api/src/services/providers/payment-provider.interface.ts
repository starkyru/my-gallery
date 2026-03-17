export interface CredentialField {
  key: string;
  label: string;
  type: 'text' | 'password';
}

export interface SettingsField {
  key: string;
  label: string;
  type: 'boolean' | 'text';
  default?: any;
}

export interface PaymentResult {
  paymentId: string;
  checkoutLink?: string;
}

export interface CaptureResult {
  status: string;
  [key: string]: any;
}

export interface WebhookResult {
  paid?: boolean;
  orderId?: number;
}

export interface PaymentProvider {
  readonly name: string;
  readonly credentialSchema: CredentialField[];
  createPayment(
    order: any,
    credentials: Record<string, string>,
    settings: Record<string, any>,
  ): Promise<PaymentResult>;
  capturePayment?(
    orderId: number,
    captureData: any,
    credentials: Record<string, string>,
    settings: Record<string, any>,
  ): Promise<CaptureResult>;
  handleWebhook(
    payload: any,
    credentials: Record<string, string>,
    settings: Record<string, any>,
  ): Promise<WebhookResult>;
}
