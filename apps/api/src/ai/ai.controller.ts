import { Controller, Post, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { AiService } from './ai.service';
import { ImagesService } from '../images/images.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly service: AiService,
    private readonly imagesService: ImagesService,
  ) {}

  @Post('describe/:imageId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async describe(@Param('imageId') imageId: string, @Query('apply') apply?: string) {
    const result = await this.service.describeImage(+imageId);
    if (apply === 'true') {
      await this.imagesService.update(+imageId, {
        title: result.title,
        description: result.description,
      });
    }
    return result;
  }
}
