import { Controller, Post, Param, Body, Logger } from '@nestjs/common';
import { ServicesService } from './services.service';
import { FulfillmentRegistryService } from './providers/fulfillment-registry.service';

@Controller('fulfillment')
export class FulfillmentController {
  private readonly logger = new Logger(FulfillmentController.name);

  constructor(
    private readonly servicesService: ServicesService,
    private readonly fulfillmentRegistry: FulfillmentRegistryService,
  ) {}

  @Post(':provider/webhook')
  async handleWebhook(@Param('provider') providerName: string, @Body() payload: any) {
    const config = await this.servicesService.getEnabledConfig('fulfillment', providerName);
    const provider = this.fulfillmentRegistry.get(providerName);
    if (!provider) {
      this.logger.warn(`Unknown fulfillment provider: ${providerName}`);
      return { ok: false };
    }

    const credentials = this.servicesService.decryptCredentials(config);
    const result = await provider.handleWebhook(payload, credentials, config.settings);
    this.logger.log(`Fulfillment webhook from ${providerName}: ${JSON.stringify(result)}`);
    return result;
  }
}
