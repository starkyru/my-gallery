import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceConfigEntity } from './service-config.entity';
import { CryptoService } from './crypto.service';
import { PaymentRegistryService } from './providers/payment-registry.service';
import { FulfillmentRegistryService } from './providers/fulfillment-registry.service';

@Injectable()
export class ServicesService implements OnModuleInit {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    @InjectRepository(ServiceConfigEntity)
    private readonly repo: Repository<ServiceConfigEntity>,
    private readonly crypto: CryptoService,
    private readonly paymentRegistry: PaymentRegistryService,
    private readonly fulfillmentRegistry: FulfillmentRegistryService,
  ) {}

  async onModuleInit() {
    const count = await this.repo.count();
    if (count === 0) {
      this.logger.log('Seeding default service configs...');
      await this.repo.save([
        this.repo.create({
          type: 'payment',
          provider: 'btcpay',
          displayName: 'BTCPay Server',
          enabled: false,
          sortOrder: 0,
        }),
        this.repo.create({
          type: 'payment',
          provider: 'paypal',
          displayName: 'PayPal',
          enabled: false,
          sortOrder: 1,
        }),
        this.repo.create({
          type: 'fulfillment',
          provider: 'prodigi',
          displayName: 'Prodigi',
          enabled: false,
          skus: [],
          sortOrder: 0,
        }),
      ]);
      this.logger.log('Default service configs seeded');
    }
  }

  async findAll(): Promise<ServiceConfigEntity[]> {
    return this.repo.find({ order: { type: 'ASC', sortOrder: 'ASC' } });
  }

  async findByProvider(provider: string): Promise<ServiceConfigEntity> {
    const config = await this.repo.findOne({ where: { provider } });
    if (!config) throw new NotFoundException(`Service config not found: ${provider}`);
    return config;
  }

  async getEnabledConfig(type: string, provider: string): Promise<ServiceConfigEntity> {
    const config = await this.repo.findOne({ where: { type, provider, enabled: true } });
    if (!config) throw new NotFoundException(`Provider ${provider} is not enabled`);
    return config;
  }

  async getEnabledByType(type: string): Promise<ServiceConfigEntity[]> {
    return this.repo.find({
      where: { type, enabled: true },
      order: { sortOrder: 'ASC' },
    });
  }

  decryptCredentials(config: ServiceConfigEntity): Record<string, string> {
    if (!config.credentials) return {};
    try {
      return JSON.parse(this.crypto.decrypt(config.credentials));
    } catch {
      this.logger.warn(`Failed to decrypt credentials for ${config.provider}`);
      return {};
    }
  }

  async update(
    provider: string,
    data: {
      enabled?: boolean;
      credentials?: Record<string, string>;
      settings?: Record<string, any>;
      skus?: { sku: string; description: string }[];
    },
  ): Promise<ServiceConfigEntity> {
    const config = await this.findByProvider(provider);

    if (data.enabled !== undefined) config.enabled = data.enabled;
    if (data.settings !== undefined) config.settings = data.settings;
    if (data.skus !== undefined) config.skus = data.skus;

    if (data.credentials !== undefined) {
      // Merge with existing credentials — only overwrite keys that have non-empty values
      const existing = this.decryptCredentials(config);
      const merged = { ...existing };
      for (const [key, value] of Object.entries(data.credentials)) {
        if (value !== '') merged[key] = value;
      }
      config.credentials = this.crypto.encrypt(JSON.stringify(merged));
    }

    return this.repo.save(config);
  }

  getConfigWithSchema(config: ServiceConfigEntity) {
    const paymentProvider = this.paymentRegistry.get(config.provider);
    const fulfillmentProvider = this.fulfillmentRegistry.get(config.provider);
    const provider = paymentProvider || fulfillmentProvider;

    const credentialFields = provider?.credentialSchema || [];
    const settingsSchema =
      (fulfillmentProvider as any)?.settingsSchema ||
      (paymentProvider as any)?.settingsSchema ||
      [];

    // Check which credential keys have values set
    const existingCreds = this.decryptCredentials(config);
    const maskedCredentials: Record<string, boolean> = {};
    for (const field of credentialFields) {
      maskedCredentials[field.key] = !!existingCreds[field.key];
    }

    return {
      provider: config.provider,
      type: config.type,
      displayName: config.displayName,
      enabled: config.enabled,
      configured: credentialFields.every((f) => !!existingCreds[f.key]),
      credentialFields,
      settingsSchema,
      maskedCredentials,
      settings: config.settings,
      skus: config.skus,
    };
  }
}
