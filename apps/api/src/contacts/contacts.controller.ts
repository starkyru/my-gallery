import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { IsString, IsEmail, MaxLength, MinLength } from 'class-validator';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { ContactsService } from './contacts.service';

class CreateContactDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  message!: string;
}

@Controller('contacts')
export class ContactsController {
  constructor(private readonly service: ContactsService) {}

  @Post()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  create(@Body() dto: CreateContactDto) {
    return this.service.create(dto.name, dto.email, dto.message);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAll() {
    return this.service.findAll();
  }

  @Put(':id/read')
  @UseGuards(JwtAuthGuard, AdminGuard)
  markRead(@Param('id') id: string) {
    return this.service.markRead(+id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
