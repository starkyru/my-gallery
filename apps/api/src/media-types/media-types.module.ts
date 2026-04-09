import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaTypeEntity } from './media-type.entity';
import { ImageMediaTypeEntity } from './image-media-type.entity';
import { MediaTypesService } from './media-types.service';
import { MediaTypesController } from './media-types.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MediaTypeEntity, ImageMediaTypeEntity])],
  controllers: [MediaTypesController],
  providers: [MediaTypesService],
  exports: [MediaTypesService],
})
export class MediaTypesModule {}
