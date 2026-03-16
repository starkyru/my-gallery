import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { IsString, IsArray, IsEnum, IsOptional, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { OrderStatus, OrderItemType } from '@gallery/shared';

class OrderItemDto {
  @IsNumber()
  imageId!: number;

  @IsEnum(OrderItemType)
  type!: OrderItemType;

  @IsOptional()
  @IsString()
  printSku?: string;
}

class ShippingAddressDto {
  @IsString()
  name!: string;

  @IsString()
  address1!: string;

  @IsOptional()
  @IsString()
  address2?: string;

  @IsString()
  city!: string;

  @IsString()
  state!: string;

  @IsString()
  postalCode!: string;

  @IsString()
  country!: string;
}

class CreateOrderDto {
  @IsString()
  customerEmail!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress?: ShippingAddressDto;
}

class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}

@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.service.create(dto.customerEmail, dto.items, dto.shippingAddress);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query('status') status?: OrderStatus) {
    return this.service.findAll(status);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  getStats() {
    return this.service.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.service.updateStatus(+id, dto.status);
  }

  @Get(':id/downloads')
  getDownloads(@Param('id') id: string) {
    return this.service.getDownloadLinks(+id);
  }
}
