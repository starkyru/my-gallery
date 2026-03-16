import { Controller, Post, Param, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post('orders/:id/btcpay')
  createBtcPayInvoice(@Param('id') id: string) {
    return this.service.createBtcPayInvoice(+id);
  }

  @Post('orders/:id/paypal')
  createPayPalOrder(@Param('id') id: string) {
    return this.service.createPayPalOrder(+id);
  }

  @Post('orders/:id/paypal/capture')
  capturePayPalOrder(@Param('id') id: string, @Body('paypalOrderId') paypalOrderId: string) {
    return this.service.capturePayPalOrder(+id, paypalOrderId);
  }

  @Post('btcpay/webhook')
  handleBtcPayWebhook(@Body() payload: any) {
    return this.service.handleBtcPayWebhook(payload);
  }
}
