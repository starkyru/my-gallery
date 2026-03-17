import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceConfigEntity } from './service-config.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { FulfillmentController } from './fulfillment.controller';
import { PaymentRegistryService } from './providers/payment-registry.service';
import { FulfillmentRegistryService } from './providers/fulfillment-registry.service';
import { BtcPayProvider } from './providers/btcpay/btcpay.provider';
import { PayPalProvider } from './providers/paypal/paypal.provider';
import { ProdigiProvider } from './providers/prodigi/prodigi.provider';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceConfigEntity])],
  controllers: [ServicesController, FulfillmentController],
  providers: [
    ServicesService,
    PaymentRegistryService,
    FulfillmentRegistryService,
    BtcPayProvider,
    PayPalProvider,
    ProdigiProvider,
  ],
  exports: [ServicesService, PaymentRegistryService, FulfillmentRegistryService],
})
export class ServicesModule implements OnModuleInit {
  constructor(
    private readonly paymentRegistry: PaymentRegistryService,
    private readonly fulfillmentRegistry: FulfillmentRegistryService,
    private readonly btcPayProvider: BtcPayProvider,
    private readonly payPalProvider: PayPalProvider,
    private readonly prodigiProvider: ProdigiProvider,
  ) {}

  onModuleInit() {
    this.paymentRegistry.register(this.btcPayProvider);
    this.paymentRegistry.register(this.payPalProvider);
    this.fulfillmentRegistry.register(this.prodigiProvider);
  }
}
