import { Controller, Post, Param, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post('orders/:id/:provider')
  createPayment(@Param('id') id: string, @Param('provider') provider: string) {
    return this.service.createPayment(+id, provider);
  }

  @Post('orders/:id/:provider/capture')
  capturePayment(@Param('id') id: string, @Param('provider') provider: string, @Body() body: any) {
    return this.service.capturePayment(+id, provider, body);
  }

  @Post(':provider/webhook')
  handleWebhook(@Param('provider') provider: string, @Body() payload: any) {
    return this.service.handleWebhook(provider, payload);
  }
}
