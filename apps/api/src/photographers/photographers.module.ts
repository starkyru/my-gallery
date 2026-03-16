import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhotographerEntity } from './photographer.entity';
import { PhotographersService } from './photographers.service';
import { PhotographersController } from './photographers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PhotographerEntity])],
  controllers: [PhotographersController],
  providers: [PhotographersService],
  exports: [PhotographersService],
})
export class PhotographersModule {}
