export interface CredentialField {
  key: string;
  label: string;
  type: 'text' | 'password';
}

export interface SettingsField {
  key: string;
  label: string;
  type: 'boolean' | 'text';
  default?: string | boolean;
}

export interface PaymentResult {
  paymentId: string;
  checkoutLink?: string;
}

export interface CaptureResult {
  status: string;
  [key: string]: unknown;
}

export interface WebhookResult {
  paid?: boolean;
  orderId?: number;
}

export interface PaymentProvider {
  readonly name: string;
  readonly credentialSchema: CredentialField[];
  createPayment(
    order: { id: number; total: number },
    credentials: Record<string, string>,
    settings: Record<string, unknown>,
  ): Promise<PaymentResult>;
  capturePayment?(
    orderId: number,
    captureData: Record<string, unknown>,
    credentials: Record<string, string>,
    settings: Record<string, unknown>,
  ): Promise<CaptureResult>;
  handleWebhook(
    payload: Record<string, unknown>,
    credentials: Record<string, string>,
    settings: Record<string, unknown>,
    rawBody?: Buffer,
    headers?: Record<string, string>,
  ): Promise<WebhookResult>;
}
