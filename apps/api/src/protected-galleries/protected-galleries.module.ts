import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProtectedGalleryEntity } from './protected-gallery.entity';
import { ProtectedGalleryImageEntity } from './protected-gallery-image.entity';
import { ImageEntity } from '../images/image.entity';
import { ProtectedGalleriesService } from './protected-galleries.service';
import { ProtectedGalleriesController } from './protected-galleries.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProtectedGalleryEntity, ProtectedGalleryImageEntity, ImageEntity]),
  ],
  controllers: [ProtectedGalleriesController],
  providers: [ProtectedGalleriesService],
  exports: [ProtectedGalleriesService],
})
export class ProtectedGalleriesModule {}
