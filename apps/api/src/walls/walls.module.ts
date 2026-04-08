import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WallBackgroundEntity } from './wall-background.entity';
import { FramePresetEntity } from './frame-preset.entity';
import { WallsController } from './walls.controller';
import { WallsService } from './walls.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WallBackgroundEntity, FramePresetEntity]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        dest: config.get('UPLOAD_DIR', './uploads'),
        limits: { fileSize: 50 * 1024 * 1024 },
      }),
    }),
  ],
  controllers: [WallsController],
  providers: [WallsService],
  exports: [WallsService],
})
export class WallsModule {}
