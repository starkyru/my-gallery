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
  UseInterceptors,
  UploadedFile,
  Res,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsIn, IsInt } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Response } from 'express';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { ImagesService } from './images.service';

class CreateImageDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  price!: number;

  @Type(() => Number)
  @IsNumber()
  artistId!: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  projectId?: number | null;
}

class UpdateImageDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  artistId?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  printEnabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  printLimit?: number | null;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @IsOptional()
  @IsBoolean()
  allowDownloadOriginal?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  projectId?: number | null;

  @IsOptional()
  @IsArray()
  printOptions?: { sku: string; description: string; price: number }[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  tagIds?: number[];

  @IsOptional()
  @IsString()
  adminNote?: string | null;
}

class BulkActionDto {
  @IsArray()
  ids!: number[];

  @IsIn(['archive', 'unarchive', 'setCategory', 'setProject'])
  action!: string;

  @IsOptional()
  @IsString()
  value?: string;
}

@Controller('images')
export class ImagesController {
  constructor(
    private readonly service: ImagesService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  findAll(
    @Query('category') category?: string,
    @Query('featured') featured?: string,
    @Query('artistId') artistId?: string,
    @Query('projectId') projectId?: string,
    @Query('tags') tags?: string,
  ) {
    return this.service.findAll({
      category,
      featured: featured === undefined ? undefined : featured === 'true',
      artistId: artistId ? +artistId : undefined,
      projectId: projectId ? +projectId : undefined,
      tags: tags ? tags.split(',').filter(Boolean).slice(0, 20) : undefined,
    });
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAllAdmin() {
    return this.service.findAllAdmin();
  }

  @Post('bulk-action')
  @UseGuards(JwtAuthGuard, AdminGuard)
  bulkAction(@Body() dto: BulkActionDto) {
    return this.service.bulkAction(dto.ids, dto.action, dto.value);
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findOneAdmin(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOnePublic(+id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  upload(@UploadedFile() file: Express.Multer.File, @Body() dto: CreateImageDto) {
    return this.service.upload(file, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdateImageDto) {
    return this.service.update(+id, { ...dto });
  }

  @Put('sort/order')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateSortOrder(@Body() updates: { id: number; sortOrder: number }[]) {
    return this.service.updateSortOrder(updates);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @Query('expires') expires: string,
    @Query('sig') sig: string,
    @Res() res: Response,
  ) {
    if (!this.service.verifyDownloadSignature(+id, expires, sig)) {
      throw new ForbiddenException('Invalid or expired download link');
    }
    const image = await this.service.findOne(+id);
    const uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
    const filePath = path.join(uploadDir, image.filePath);
    res.download(filePath, `${image.title}${path.extname(image.filePath)}`);
  }
}
