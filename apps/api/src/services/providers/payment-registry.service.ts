import { Injectable } from '@nestjs/common';
import { PaymentProvider } from './payment-provider.interface';

@Injectable()
export class PaymentRegistryService {
  private readonly providers = new Map<string, PaymentProvider>();

  register(provider: PaymentProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): PaymentProvider | undefined {
    return this.providers.get(name);
  }

  getAll(): PaymentProvider[] {
    return Array.from(this.providers.values());
  }
}
