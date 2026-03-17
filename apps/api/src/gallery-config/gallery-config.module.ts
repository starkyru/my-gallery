import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GalleryConfigEntity } from './gallery-config.entity';
import { GalleryConfigService } from './gallery-config.service';
import { GalleryConfigController } from './gallery-config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GalleryConfigEntity])],
  controllers: [GalleryConfigController],
  providers: [GalleryConfigService],
  exports: [GalleryConfigService],
})
export class GalleryConfigModule {}
