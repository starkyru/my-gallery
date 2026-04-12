import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from './order.entity';
import { OrderItemEntity } from './order-item.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ImagesModule } from '../images/images.module';
import { ShippingModule } from '../shipping/shipping.module';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity, OrderItemEntity]), ImagesModule, ShippingModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
