import { Module } from '@nestjs/common';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';
import { EasyPostProvider } from '../services/providers/easypost/easypost.provider';
import { GalleryConfigModule } from '../gallery-config/gallery-config.module';
import { ImagesModule } from '../images/images.module';

@Module({
  imports: [GalleryConfigModule, ImagesModule],
  controllers: [ShippingController],
  providers: [ShippingService, EasyPostProvider],
  exports: [ShippingService],
})
export class ShippingModule {}
