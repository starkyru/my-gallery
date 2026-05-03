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
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsIn,
  IsInt,
  MaxLength,
  Matches,
  ValidateNested,
  ValidateIf,
  Min,
} from 'class-validator';
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
  @IsString()
  @IsIn(['photo', 'painting'])
  type?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  projectId?: number | null;
}

class PrintOptionDto {
  @IsString()
  sku!: string;

  @IsString()
  description!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  widthCm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  heightCm?: number;

  @IsOptional()
  @IsString()
  mediaType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  printLimit?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  soldCount?: number;
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
  @IsString()
  @IsIn(['photo', 'painting'])
  type?: string;

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
  @IsBoolean()
  perOptionLimits?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrintOptionDto)
  printOptions?: PrintOptionDto[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  tagIds?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  mediaTypeIds?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  paintTypeIds?: number[];

  @IsOptional()
  @IsString()
  adminNote?: string | null;

  @IsOptional()
  @ValidateIf((_o, value) => value !== null)
  @IsString()
  @MaxLength(10)
  @Matches(/^\d{4}(-\d{2}(-\d{2})?)?$/, {
    message: 'shotDate must be YYYY, YYYY-MM, or YYYY-MM-DD',
  })
  shotDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  place?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sizeWidthCm?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sizeHeightCm?: number | null;

  @IsOptional()
  @IsBoolean()
  originalAvailable?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weightGrams?: number | null;
}

class BulkActionDto {
  @IsArray()
  ids!: number[];

  @IsIn(['archive', 'unarchive', 'setCategory', 'setProject', 'setArtist', 'setType'])
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
    @Query('mediaTypes') mediaTypes?: string,
    @Query('paintTypes') paintTypes?: string,
    @Query('type') type?: string,
  ) {
    return this.service.findAll({
      category,
      type: type && ['photo', 'painting'].includes(type) ? type : undefined,
      featured: featured === undefined ? undefined : featured === 'true',
      artistId: artistId ? +artistId : undefined,
      projectId: projectId ? +projectId : undefined,
      tags: tags ? tags.split(',').filter(Boolean).slice(0, 20) : undefined,
      mediaTypes: mediaTypes ? mediaTypes.split(',').filter(Boolean).slice(0, 20) : undefined,
      paintTypes: paintTypes ? paintTypes.split(',').filter(Boolean).slice(0, 20) : undefined,
    });
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAllAdmin() {
    return this.service.findAllAdmin();
  }

  @Get('admin/regenerate-blurhashes')
  @UseGuards(JwtAuthGuard, AdminGuard)
  regenerateBlurhashes() {
    return this.service.regenerateAllBlurhashes();
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
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } }),
  )
  upload(@UploadedFile() file: Express.Multer.File, @Body() dto: CreateImageDto) {
    return this.service.upload(file, dto);
  }

  @Put(':id/reupload')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } }),
  )
  reupload(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.service.reupload(+id, file);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdateImageDto) {
    return this.service.update(+id, dto);
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
    const image = await this.service.findOneEntity(+id);
    const uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
    const filePath = path.join(uploadDir, image.filePath);
    const safeName = (image.title || 'image').replace(/[^a-zA-Z0-9._\s-]/g, '_');
    res.download(filePath, `${safeName}${path.extname(image.filePath)}`);
  }
}
