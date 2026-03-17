import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  PaymentProvider,
  PaymentResult,
  WebhookResult,
  CredentialField,
} from './payment-provider.interface';

@Injectable()
export class BtcPayProvider implements PaymentProvider {
  private readonly logger = new Logger(BtcPayProvider.name);

  readonly name = 'btcpay';

  readonly credentialSchema: CredentialField[] = [
    { key: 'url', label: 'BTCPay Server URL', type: 'text' },
    { key: 'apiKey', label: 'API Key', type: 'password' },
    { key: 'storeId', label: 'Store ID', type: 'text' },
    { key: 'webhookSecret', label: 'Webhook Secret', type: 'password' },
  ];

  constructor(private readonly configService: ConfigService) {}

  async createPayment(
    order: { id: number; total: number },
    credentials: Record<string, string>,
    _settings: Record<string, unknown>,
  ): Promise<PaymentResult> {
    const { url, apiKey, storeId } = credentials;
    const publicUrl = this.configService.get('PUBLIC_URL');

    const response = await fetch(`${url}/api/v1/stores/${storeId}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${apiKey}`,
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
    credentials: Record<string, string>,
    _settings: Record<string, unknown>,
    rawBody?: Buffer,
    headers?: Record<string, string>,
  ): Promise<WebhookResult> {
    // Verify BTCPAY-SIG header
    const { webhookSecret } = credentials;
    if (webhookSecret && rawBody) {
      const sig = headers?.['btcpay-sig'];
      if (!sig) {
        throw new UnauthorizedException('Missing BTCPAY-SIG header');
      }
      const expectedSig =
        'sha256=' + crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
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
