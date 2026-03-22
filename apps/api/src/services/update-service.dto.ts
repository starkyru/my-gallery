import { IsBoolean, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SkuDto {
  @IsString()
  sku!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  price?: string;
}

export class UpdateServiceDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkuDto)
  skus?: SkuDto[];

  @IsOptional()
  @IsBoolean()
  sandbox?: boolean;
}
