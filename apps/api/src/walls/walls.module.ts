import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WallBackgroundEntity } from './wall-background.entity';
import { FramePresetEntity } from './frame-preset.entity';
import { WallsController } from './walls.controller';
import { WallsService } from './walls.service';

@Module({
  imports: [TypeOrmModule.forFeature([WallBackgroundEntity, FramePresetEntity])],
  controllers: [WallsController],
  providers: [WallsService],
  exports: [WallsService],
})
export class WallsModule {}
