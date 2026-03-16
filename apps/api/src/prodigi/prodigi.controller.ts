import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProdigiService } from './prodigi.service';

@Controller('prodigi')
export class ProdigiController {
  constructor(private readonly service: ProdigiService) {}

  @Get('skus')
  @UseGuards(JwtAuthGuard)
  getSkus() {
    return this.service.getAvailableSkus();
  }

  @Post('webhook')
  handleWebhook(@Body() payload: any) {
    return this.service.handleWebhook(payload);
  }
}
