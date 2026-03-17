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
import { IsString, IsEmail, IsBoolean } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminGuard } from './admin.guard';

class LoginDto {
  @IsString()
  username!: string;

  @IsString()
  password!: string;
}

class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  newPassword!: string;
}

class CreateUserDto {
  @IsString()
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
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
  newPassword!: string;
}

class SetPasswordDto {
  @IsString()
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
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Put('password')
  changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
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
  removeUser(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
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
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.requestPasswordReset(dto.email);
    return { message: 'If that email is registered, a reset link has been sent.' };
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Password has been reset successfully.' };
  }
}
