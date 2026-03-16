import { Module } from '@nestjs/common';
import { ProdigiService } from './prodigi.service';
import { ProdigiController } from './prodigi.controller';

@Module({
  controllers: [ProdigiController],
  providers: [ProdigiService],
  exports: [ProdigiService],
})
export class ProdigiModule {}
