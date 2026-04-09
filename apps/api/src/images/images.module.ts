import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ImageEntity } from './image.entity';
import { ImagePrintOptionEntity } from './image-print-option.entity';
import { ImageTagEntity } from '../tags/image-tag.entity';
import { ImageMediaTypeEntity } from '../media-types/image-media-type.entity';
import { ImagePaintTypeEntity } from '../paint-types/image-paint-type.entity';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ImageEntity,
      ImagePrintOptionEntity,
      ImageTagEntity,
      ImageMediaTypeEntity,
      ImagePaintTypeEntity,
    ]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        dest: config.get('UPLOAD_DIR', './uploads'),
        limits: { fileSize: 50 * 1024 * 1024 },
      }),
    }),
  ],
  controllers: [ImagesController],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}
