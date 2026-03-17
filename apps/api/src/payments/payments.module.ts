import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { OrdersModule } from '../orders/orders.module';
import { ImagesModule } from '../images/images.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [OrdersModule, ImagesModule, ServicesModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
