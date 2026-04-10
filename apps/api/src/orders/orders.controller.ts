import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  Headers,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  IsString,
  IsArray,
  IsEnum,
  IsOptional,
  IsEmail,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
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
  @IsEmail()
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
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAll(@Query('status') status?: OrderStatus) {
    return this.service.findAll(status);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getStats() {
    return this.service.getStats();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('token') queryToken?: string,
    @Headers('x-order-token') headerToken?: string,
    @Request() req?: { user?: { role?: string } },
  ) {
    const token = headerToken || queryToken;
    const isAdmin = req?.user?.role === 'admin';
    return this.service.findOneSecure(+id, token, isAdmin);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.service.updateStatus(+id, dto.status);
  }

  @Get(':id/downloads')
  getDownloads(
    @Param('id') id: string,
    @Query('token') queryToken?: string,
    @Headers('x-order-token') headerToken?: string,
    @Request() req?: { user?: { role?: string } },
  ) {
    const token = headerToken || queryToken;
    const isAdmin = req?.user?.role === 'admin';
    return this.service.getDownloadLinks(+id, token, isAdmin);
  }
}
