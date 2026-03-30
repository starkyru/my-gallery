import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { WallsService } from './walls.service';

@Controller('walls')
export class WallsController {
  constructor(private readonly service: WallsService) {}

  @Get()
  findAll() {
    return this.service.findAllWalls();
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      name: string;
      wallWidthCm?: string;
      wallHeightCm?: string;
      anchorX?: string;
      anchorY?: string;
    },
  ) {
    return this.service.createWall(file, {
      name: body.name,
      wallWidthCm: body.wallWidthCm ? parseFloat(body.wallWidthCm) : undefined,
      wallHeightCm: body.wallHeightCm ? parseFloat(body.wallHeightCm) : undefined,
      anchorX: body.anchorX ? parseFloat(body.anchorX) : undefined,
      anchorY: body.anchorY ? parseFloat(body.anchorY) : undefined,
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      wallWidthCm?: number | null;
      wallHeightCm?: number | null;
      anchorX?: number;
      anchorY?: number;
      isDefault?: boolean;
      sortOrder?: number;
    },
  ) {
    return this.service.updateWall(+id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this.service.removeWall(+id);
  }

  @Get('frames')
  findFrames() {
    return this.service.findEnabledFrames();
  }

  @Get('frames/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAllFrames() {
    return this.service.findAllFrames();
  }

  @Put('frames/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateFrame(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      borderColor?: string;
      borderWidthMm?: number;
      matColor?: string;
      matWidthMm?: number;
      shadowEnabled?: boolean;
      enabled?: boolean;
      sortOrder?: number;
    },
  ) {
    return this.service.updateFrame(+id, body);
  }
}
