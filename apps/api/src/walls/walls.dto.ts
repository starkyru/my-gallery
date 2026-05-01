import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWallDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  wallWidthCm?: string;

  @IsOptional()
  @IsString()
  wallHeightCm?: string;

  @IsOptional()
  @IsString()
  anchorX?: string;

  @IsOptional()
  @IsString()
  anchorY?: string;
}

export class UpdateWallDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  wallWidthCm?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  wallHeightCm?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  anchorX?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  anchorY?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;
}

export class UpdateFrameDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  borderColor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  borderWidthMm?: number;

  @IsOptional()
  @IsString()
  matColor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  matWidthMm?: number;

  @IsOptional()
  @IsBoolean()
  shadowEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;
}
