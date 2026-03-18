import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { IsString, IsOptional, IsBoolean, IsArray, IsNumber, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { Throttle } from '@nestjs/throttler';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import * as archiver from 'archiver';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { ProtectedGalleriesService } from './protected-galleries.service';

class CreateGalleryDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsString()
  @MinLength(4)
  password!: string;
}

class UpdateGalleryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}

class AddImagesDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  imageIds!: number[];
}

class AuthenticateDto {
  @IsString()
  password!: string;
}

@Controller('protected-galleries')
export class ProtectedGalleriesController {
  constructor(private readonly service: ProtectedGalleriesService) {}

  // --- Admin routes ---

  @Get('admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAllAdmin() {
    return this.service.findAllAdmin();
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body() dto: CreateGalleryDto) {
    return this.service.create(dto.name, dto.slug, dto.password);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdateGalleryDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id') id: string, @Query('deleteImages') deleteImages?: string) {
    return this.service.remove(+id, deleteImages === 'true');
  }

  @Get(':id/images')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getImages(@Param('id') id: string) {
    return this.service.getGalleryImages(+id);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard, AdminGuard)
  addImages(@Param('id') id: string, @Body() dto: AddImagesDto) {
    return this.service.addImages(+id, dto.imageIds);
  }

  @Delete(':id/images/:imageId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  removeImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.service.removeImage(+id, +imageId);
  }

  // --- Public routes ---

  @Post(':slug/auth')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async authenticate(@Param('slug') slug: string, @Body() dto: AuthenticateDto) {
    const accessToken = await this.service.authenticate(slug, dto.password);
    return { accessToken };
  }

  @Get(':slug')
  getPublic(@Param('slug') slug: string, @Query('token') token?: string) {
    if (!token) throw new UnauthorizedException('Access token required');
    return this.service.findBySlugPublic(slug, token);
  }

  @Get(':slug/images/:imageId/download')
  async downloadImage(
    @Param('slug') slug: string,
    @Param('imageId') imageId: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    if (!token) throw new UnauthorizedException('Access token required');
    const file = await this.service.getOriginalPathForImage(slug, +imageId, token);
    res.download(file.filePath, file.name);
  }

  @Get(':slug/download')
  async download(@Param('slug') slug: string, @Query('token') token: string, @Res() res: Response) {
    if (!token) throw new UnauthorizedException('Access token required');
    const files = await this.service.getOriginalPaths(slug, token);

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${slug.replace(/[^a-z0-9_-]/gi, '_')}.zip"`,
    });

    const archive = archiver.default('zip', { zlib: { level: 5 } });
    archive.pipe(res);

    const usedNames = new Set<string>();
    for (const file of files) {
      let name = file.name.replace(/[/\\:*?"<>|]/g, '_');
      if (usedNames.has(name)) {
        const ext = name.lastIndexOf('.');
        const base = ext > 0 ? name.slice(0, ext) : name;
        const extStr = ext > 0 ? name.slice(ext) : '';
        let counter = 2;
        while (usedNames.has(`${base}_${counter}${extStr}`)) counter++;
        name = `${base}_${counter}${extStr}`;
      }
      usedNames.add(name);
      archive.file(file.filePath, { name });
    }

    await archive.finalize();
  }
}
