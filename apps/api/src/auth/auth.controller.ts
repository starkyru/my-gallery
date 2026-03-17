import {
  Controller,
  Post,
  Put,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { IsString, IsEmail, IsBoolean, MinLength } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminGuard } from './admin.guard';

class LoginDto {
  @IsString()
  username!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}

class CreateUserDto {
  @IsString()
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}

class SetPasswordDto {
  @IsString()
  @MinLength(8)
  password!: string;
}

class ToggleLoginDto {
  @IsBoolean()
  loginEnabled!: boolean;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Put('password')
  changePassword(
    @Request() req: { user: { id: number; role: string } },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('users')
  listUsers() {
    return this.authService.findAll();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('users')
  createUser(@Body() dto: CreateUserDto) {
    return this.authService.createUser(dto.username, dto.email, dto.password);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('users/:id')
  removeUser(@Param('id', ParseIntPipe) id: number, @Request() req: { user: { id: number } }) {
    return this.authService.removeUser(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('photographers/:id/password')
  setPhotographerPassword(@Param('id', ParseIntPipe) id: number, @Body() dto: SetPasswordDto) {
    return this.authService.setPhotographerPassword(id, dto.password);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('photographers/:id/login')
  togglePhotographerLogin(@Param('id', ParseIntPipe) id: number, @Body() dto: ToggleLoginDto) {
    return this.authService.togglePhotographerLogin(id, dto.loginEnabled);
  }

  @Post('forgot-password')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.requestPasswordReset(dto.email);
    return { message: 'If that email is registered, a reset link has been sent.' };
  }

  @Post('reset-password')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Password has been reset successfully.' };
  }
}
