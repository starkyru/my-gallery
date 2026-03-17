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
import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Response } from 'express';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ImagesService } from './images.service';
import { ImageCategory } from '@gallery/shared';

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
  photographerId!: number;

  @IsOptional()
  @IsEnum(ImageCategory)
  category?: ImageCategory;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isFeatured?: boolean;
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
  photographerId?: number;

  @IsOptional()
  @IsEnum(ImageCategory)
  category?: ImageCategory;

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
  @IsArray()
  printOptions?: { sku: string; description: string; price: number }[];
}

@Controller('images')
export class ImagesController {
  constructor(
    private readonly service: ImagesService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  findAll(@Query('category') category?: ImageCategory, @Query('featured') featured?: string) {
    return this.service.findAll({
      category,
      featured: featured === undefined ? undefined : featured === 'true',
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { storage: undefined }))
  upload(@UploadedFile() file: Express.Multer.File, @Body() dto: CreateImageDto) {
    return this.service.upload(file, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateImageDto) {
    return this.service.update(+id, { ...dto });
  }

  @Put('sort/order')
  @UseGuards(JwtAuthGuard)
  updateSortOrder(@Body() updates: { id: number; sortOrder: number }[]) {
    return this.service.updateSortOrder(updates);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
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
