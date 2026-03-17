import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceConfigEntity } from './service-config.entity';
import { PaymentRegistryService } from './providers/payment-registry.service';
import { FulfillmentRegistryService } from './providers/fulfillment-registry.service';

@Injectable()
export class ServicesService implements OnModuleInit {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    @InjectRepository(ServiceConfigEntity)
    private readonly repo: Repository<ServiceConfigEntity>,
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

  async update(
    provider: string,
    data: {
      enabled?: boolean;
      skus?: { sku: string; description: string }[];
    },
  ): Promise<ServiceConfigEntity> {
    const config = await this.findByProvider(provider);

    if (data.enabled !== undefined) config.enabled = data.enabled;
    if (data.skus !== undefined) config.skus = data.skus;

    return this.repo.save(config);
  }

  getConfigResponse(config: ServiceConfigEntity) {
    const paymentProvider = this.paymentRegistry.get(config.provider);
    const fulfillmentProvider = this.fulfillmentRegistry.get(config.provider);
    const provider = paymentProvider || fulfillmentProvider;

    return {
      provider: config.provider,
      type: config.type,
      displayName: config.displayName,
      enabled: config.enabled,
      configured: provider?.configured ?? false,
      skus: config.skus,
    };
  }
}
