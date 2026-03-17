import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async list() {
    const configs = await this.servicesService.findAll();
    return configs.map((c) => this.servicesService.getConfigWithSchema(c));
  }

  @Put(':provider')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(
    @Param('provider') provider: string,
    @Body()
    body: {
      enabled?: boolean;
      credentials?: Record<string, string>;
      settings?: Record<string, unknown>;
      skus?: { sku: string; description: string }[];
    },
  ) {
    const config = await this.servicesService.update(provider, body);
    return this.servicesService.getConfigWithSchema(config);
  }

  @Get('payment/enabled')
  async enabledPayments() {
    const configs = await this.servicesService.getEnabledByType('payment');
    return configs.map((c) => ({
      provider: c.provider,
      displayName: c.displayName,
    }));
  }

  @Get('fulfillment/skus')
  async fulfillmentSkus() {
    const configs = await this.servicesService.getEnabledByType('fulfillment');
    const skus: { provider: string; sku: string; description: string }[] = [];
    for (const config of configs) {
      for (const s of config.skus || []) {
        skus.push({ provider: config.provider, sku: s.sku, description: s.description });
      }
    }
    return skus;
  }
}
