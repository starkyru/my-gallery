import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  IsArray,
  IsNumber,
  ValidateNested,
  IsString,
  IsOptional,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { ShippingService } from './shipping.service';

class ShippingAddressDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsString()
  @MaxLength(500)
  address1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address2?: string;

  @IsString()
  @MaxLength(200)
  city!: string;

  @IsString()
  @MaxLength(100)
  state!: string;

  @IsString()
  @MaxLength(20)
  postalCode!: string;

  @IsString()
  @MaxLength(2)
  country!: string;
}

class GetShippingRatesDto {
  @IsArray()
  @ArrayMaxSize(10)
  @IsNumber({}, { each: true })
  imageIds!: number[];

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  toAddress!: ShippingAddressDto;
}

@Controller('shipping')
export class ShippingController {
  constructor(private readonly service: ShippingService) {}

  @Post('rates')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  getRates(@Body() dto: GetShippingRatesDto) {
    return this.service.getRates(dto.imageIds, dto.toAddress);
  }
}
