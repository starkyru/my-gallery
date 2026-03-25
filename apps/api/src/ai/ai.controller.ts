import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly service: AiService) {}

  @Post('describe/:imageId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  describe(@Param('imageId') imageId: string) {
    return this.service.describeImage(+imageId);
  }
}
