import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaintTypeEntity } from './paint-type.entity';
import { ImagePaintTypeEntity } from './image-paint-type.entity';
import { PaintTypesService } from './paint-types.service';
import { PaintTypesController } from './paint-types.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PaintTypeEntity, ImagePaintTypeEntity])],
  controllers: [PaintTypesController],
  providers: [PaintTypesService],
  exports: [PaintTypesService],
})
export class PaintTypesModule {}
