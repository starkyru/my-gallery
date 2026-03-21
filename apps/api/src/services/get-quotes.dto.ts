import { IsArray, IsString, ArrayMaxSize, ArrayMinSize } from 'class-validator';

export class GetQuotesDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  skus!: string[];

  @IsString()
  countryCode!: string;

  @IsString()
  currencyCode!: string;
}
