import { Controller, Post, Param, Body, Req, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentRegistryService } from '../services/providers/payment-registry.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly service: PaymentsService,
    private readonly paymentRegistry: PaymentRegistryService,
  ) {}

  private validateProvider(provider: string) {
    if (!this.paymentRegistry.get(provider)) {
      throw new BadRequestException(`Unknown payment provider: ${provider}`);
    }
  }

  @Post('orders/:id/:provider')
  createPayment(@Param('id') id: string, @Param('provider') provider: string) {
    this.validateProvider(provider);
    return this.service.createPayment(+id, provider);
  }

  @Post('orders/:id/:provider/capture')
  capturePayment(
    @Param('id') id: string,
    @Param('provider') provider: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.validateProvider(provider);
    return this.service.capturePayment(+id, provider, body);
  }

  @Post(':provider/webhook')
  handleWebhook(
    @Param('provider') provider: string,
    @Body() payload: Record<string, unknown>,
    @Req() req: { rawBody?: Buffer; headers: Record<string, string> },
  ) {
    this.validateProvider(provider);
    return this.service.handleWebhook(provider, payload, req.rawBody, req.headers);
  }
}
