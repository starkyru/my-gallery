import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PaymentProvider, PaymentResult, WebhookResult } from '../payment-provider.interface';
import { loadProviderEnv } from '../load-env';

@Injectable()
export class BtcPayProvider implements PaymentProvider {
  private readonly logger = new Logger(BtcPayProvider.name);
  private readonly url: string;
  private readonly apiKey: string;
  private readonly storeId: string;
  private readonly webhookSecret: string;

  readonly name = 'btcpay';

  constructor(private readonly configService: ConfigService) {
    const env = loadProviderEnv(__dirname);
    this.url = env.BTCPAY_URL || '';
    this.apiKey = env.BTCPAY_API_KEY || '';
    this.storeId = env.BTCPAY_STORE_ID || '';
    this.webhookSecret = env.BTCPAY_WEBHOOK_SECRET || '';
  }

  get configured(): boolean {
    return !!(this.url && this.apiKey && this.storeId && this.webhookSecret);
  }

  get configHint(): string | undefined {
    if (this.configured) return undefined;
    const missing = [
      !this.url && 'BTCPAY_URL',
      !this.apiKey && 'BTCPAY_API_KEY',
      !this.storeId && 'BTCPAY_STORE_ID',
      !this.webhookSecret && 'BTCPAY_WEBHOOK_SECRET',
    ].filter(Boolean);
    return `Missing: ${missing.join(', ')}`;
  }

  async createPayment(order: { id: number; total: number }): Promise<PaymentResult> {
    const publicUrl = this.configService.get('PUBLIC_URL');

    const response = await fetch(`${this.url}/api/v1/stores/${this.storeId}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${this.apiKey}`,
      },
      body: JSON.stringify({
        amount: order.total,
        currency: 'USD',
        metadata: { orderId: order.id },
        checkout: {
          redirectURL: `${publicUrl}/orders/${order.id}/success`,
        },
      }),
    });

    const invoice = await response.json();
    if (!response.ok) {
      this.logger.error('BTCPay invoice creation failed', invoice);
      throw new Error(`BTCPay error: ${invoice.message || response.statusText}`);
    }

    return { paymentId: invoice.id, checkoutLink: invoice.checkoutLink };
  }

  async handleWebhook(
    payload: Record<string, unknown>,
    rawBody?: Buffer,
    headers?: Record<string, string>,
  ): Promise<WebhookResult> {
    if (this.webhookSecret && rawBody) {
      const sig = headers?.['btcpay-sig'];
      if (!sig) {
        throw new UnauthorizedException('Missing BTCPAY-SIG header');
      }
      const expectedSig =
        'sha256=' + crypto.createHmac('sha256', this.webhookSecret).update(rawBody).digest('hex');
      const sigBuf = Buffer.from(sig);
      const expectedBuf = Buffer.from(expectedSig);
      if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        throw new UnauthorizedException('Invalid BTCPAY-SIG signature');
      }
    }

    if (payload.type === 'InvoiceSettled') {
      const metadata = payload.metadata as Record<string, unknown> | undefined;
      const orderId = metadata?.orderId;
      if (orderId) {
        return { paid: true, orderId: Number(orderId) };
      }
    }
    return {};
  }
}
