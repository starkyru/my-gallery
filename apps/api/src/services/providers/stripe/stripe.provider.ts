import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import type { Event as StripeEvent } from 'stripe/cjs/resources/Events.js';
import { PaymentProvider, PaymentResult, WebhookResult } from '../payment-provider.interface';
import { loadProviderEnv } from '../load-env';

@Injectable()
export class StripeProvider implements PaymentProvider {
  private readonly logger = new Logger(StripeProvider.name);
  private readonly secretKey: string;
  private readonly webhookSecret: string;
  private client: InstanceType<typeof Stripe> | null = null;

  readonly name = 'stripe';

  constructor(private readonly configService: ConfigService) {
    const env = loadProviderEnv(__dirname);
    this.secretKey = env.STRIPE_SECRET_KEY || '';
    this.webhookSecret = env.STRIPE_WEBHOOK_SECRET || '';
  }

  private getClient(): InstanceType<typeof Stripe> {
    if (!this.configured) {
      throw new Error('Stripe is not configured: missing secret key or webhook secret');
    }
    if (!this.client) {
      this.client = new Stripe(this.secretKey);
    }
    return this.client;
  }

  get configured(): boolean {
    return !!(this.secretKey && this.webhookSecret);
  }

  get configHint(): string | undefined {
    if (this.configured) return undefined;
    const missing = [
      !this.secretKey && 'STRIPE_SECRET_KEY',
      !this.webhookSecret && 'STRIPE_WEBHOOK_SECRET',
    ].filter(Boolean);
    return `Missing: ${missing.join(', ')}`;
  }

  async createPayment(order: { id: number; total: number }): Promise<PaymentResult> {
    const publicUrl = this.configService.get('PUBLIC_URL');
    const stripe = this.getClient();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(order.total * 100),
            product_data: {
              name: `Order #${order.id}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: { orderId: String(order.id) },
      success_url: `${publicUrl}/orders/${order.id}/success`,
      cancel_url: `${publicUrl}/checkout`,
    });

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL');
    }

    return { paymentId: session.id, checkoutLink: session.url };
  }

  async handleWebhook(
    _payload: Record<string, unknown>,
    rawBody?: Buffer,
    headers?: Record<string, string>,
  ): Promise<WebhookResult> {
    if (!rawBody) {
      throw new UnauthorizedException('Missing raw body for webhook verification');
    }

    const sig = headers?.['stripe-signature'];
    if (!sig) {
      throw new UnauthorizedException('Missing stripe-signature header');
    }

    const stripe = this.getClient();
    let event: StripeEvent;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, this.webhookSecret);
    } catch (err) {
      this.logger.error('Stripe webhook signature verification failed', err);
      throw new UnauthorizedException('Invalid stripe webhook signature');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      if (orderId && session.payment_status === 'paid') {
        return { paid: true, orderId: Number(orderId) };
      }
    }

    if (event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        return { paid: true, orderId: Number(orderId) };
      }
    }

    return {};
  }
}
