import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { GalleryConfigService } from './gallery-config.service';
import { UpdateGalleryConfigDto } from './update-gallery-config.dto';

@Controller('gallery-config')
export class GalleryConfigController {
  constructor(private readonly service: GalleryConfigService) {}

  @Get()
  get() {
    return this.service.get();
  }

  @Put()
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Body() data: UpdateGalleryConfigDto) {
    return this.service.update(data);
  }
}
