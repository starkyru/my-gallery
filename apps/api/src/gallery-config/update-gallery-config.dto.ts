import {
  IsString,
  IsOptional,
  IsUrl,
  ValidateIf,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

class ShipFromAddressDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  company?: string;

  @IsString()
  @MaxLength(500)
  street1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  street2?: string;

  @IsString()
  @MaxLength(200)
  city!: string;

  @IsString()
  @MaxLength(100)
  state!: string;

  @IsString()
  @MaxLength(20)
  zip!: string;

  @IsString()
  @MaxLength(2)
  country!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}

export class UpdateGalleryConfigDto {
  @IsOptional()
  @IsString()
  galleryName?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== '')
  @IsUrl({}, { message: 'siteUrl must be a valid URL' })
  @IsString()
  siteUrl?: string;

  @IsOptional()
  @IsString()
  aboutText?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShipFromAddressDto)
  shipFromAddress?: ShipFromAddressDto;
}
