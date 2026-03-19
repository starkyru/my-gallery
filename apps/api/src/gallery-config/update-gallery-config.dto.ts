import { IsString, IsOptional, IsUrl, ValidateIf } from 'class-validator';

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
}
