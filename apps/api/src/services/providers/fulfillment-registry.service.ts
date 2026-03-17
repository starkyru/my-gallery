import { Injectable } from '@nestjs/common';
import { FulfillmentProvider } from './fulfillment-provider.interface';

@Injectable()
export class FulfillmentRegistryService {
  private readonly providers = new Map<string, FulfillmentProvider>();

  register(provider: FulfillmentProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): FulfillmentProvider | undefined {
    return this.providers.get(name);
  }

  getAll(): FulfillmentProvider[] {
    return Array.from(this.providers.values());
  }
}
