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
  readonly configured: boolean;
  createPayment(order: { id: number; total: number }): Promise<PaymentResult>;
  capturePayment?(orderId: number, captureData: Record<string, unknown>): Promise<CaptureResult>;
  handleWebhook(
    payload: Record<string, unknown>,
    rawBody?: Buffer,
    headers?: Record<string, string>,
  ): Promise<WebhookResult>;
}
