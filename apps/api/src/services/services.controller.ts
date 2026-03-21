import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { ServicesService } from './services.service';
import { UpdateServiceDto } from './update-service.dto';
import { GetQuotesDto } from './get-quotes.dto';
import { FulfillmentRegistryService } from './providers/fulfillment-registry.service';
import { ProdigiProvider } from './providers/prodigi/prodigi.provider';

@Controller('services')
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly fulfillmentRegistry: FulfillmentRegistryService,
  ) {}

  @Get('status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getStatus() {
    return { encryptionKeySet: this.servicesService.isEncryptionKeySet() };
  }

  @Get('catalogue/categories')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async catalogueCategories() {
    const provider = this.fulfillmentRegistry.get('prodigi');
    if (!provider) {
      throw new BadRequestException('Prodigi provider is not configured');
    }
    return (provider as ProdigiProvider).getCatalogueCategories();
  }

  @Get('catalogue/products/:slug')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async catalogueProduct(@Param('slug') slug: string) {
    const provider = this.fulfillmentRegistry.get('prodigi');
    if (!provider) {
      throw new BadRequestException('Prodigi provider is not configured');
    }
    return (provider as ProdigiProvider).getCatalogueProduct(slug);
  }

  @Post('prodigi/quotes')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async prodigiQuotes(@Body() body: GetQuotesDto) {
    const provider = this.fulfillmentRegistry.get('prodigi');
    if (!provider) {
      throw new BadRequestException('Prodigi provider is not configured');
    }
    return (provider as ProdigiProvider).getQuotes(body.skus, body.countryCode, body.currencyCode);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async list() {
    const configs = await this.servicesService.findAll();
    return configs.map((c) => this.servicesService.getConfigResponse(c));
  }

  @Put(':provider')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(@Param('provider') provider: string, @Body() body: UpdateServiceDto) {
    const config = await this.servicesService.update(provider, body);
    return this.servicesService.getConfigResponse(config);
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
