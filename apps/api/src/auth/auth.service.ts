import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { AdminUserEntity } from './admin-user.entity';
import { ArtistEntity } from '../artists/artist.entity';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(AdminUserEntity)
    private readonly adminRepo: Repository<AdminUserEntity>,
    @InjectRepository(ArtistEntity)
    private readonly artistRepo: Repository<ArtistEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const count = await this.adminRepo.count();
    if (count === 0) {
      const password = this.configService.get('ADMIN_INITIAL_PASSWORD', 'admin');
      const email = this.configService.get('ADMIN_EMAIL', '');
      const hash = await bcrypt.hash(password, 12);
      await this.adminRepo.save({
        username: 'admin',
        email,
        passwordHash: hash,
        mustChangePassword: true,
      });
    }
  }

  async login(username: string, password: string) {
    // Try admin first
    const admin = await this.adminRepo.findOne({ where: { username } });
    if (admin) {
      const valid = await bcrypt.compare(password, admin.passwordHash);
      if (!valid) throw new UnauthorizedException('Invalid credentials');

      const payload = { sub: admin.id, username: admin.username, role: 'admin' as const };
      return {
        accessToken: this.jwtService.sign(payload),
        role: 'admin' as const,
        ...(admin.mustChangePassword && { mustChangePassword: true }),
      };
    }

    // Try artist
    const artist = await this.artistRepo.findOne({ where: { name: username } });
    if (artist && artist.loginEnabled && artist.passwordHash) {
      const valid = await bcrypt.compare(password, artist.passwordHash);
      if (!valid) throw new UnauthorizedException('Invalid credentials');

      const payload = {
        sub: artist.id,
        username: artist.name,
        role: 'artist' as const,
        artistId: artist.id,
      };
      return {
        accessToken: this.jwtService.sign(payload),
        role: 'artist' as const,
        artistId: artist.id,
      };
    }

    throw new UnauthorizedException('Invalid credentials');
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
    role: string = 'admin',
  ) {
    if (role === 'artist') {
      const artist = await this.artistRepo.findOne({ where: { id: userId } });
      if (!artist || !artist.passwordHash) throw new UnauthorizedException('User not found');

      const valid = await bcrypt.compare(currentPassword, artist.passwordHash);
      if (!valid) throw new BadRequestException('Current password is incorrect');

      artist.passwordHash = await bcrypt.hash(newPassword, 12);
      await this.artistRepo.save(artist);
      return;
    }

    const user = await this.adminRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.mustChangePassword = false;
    await this.adminRepo.save(user);
  }

  async setArtistPassword(artistId: number, newPassword: string) {
    const artist = await this.artistRepo.findOne({ where: { id: artistId } });
    if (!artist) throw new BadRequestException('Artist not found');

    artist.passwordHash = await bcrypt.hash(newPassword, 12);
    await this.artistRepo.save(artist);
  }

  async toggleArtistLogin(artistId: number, enabled: boolean) {
    const artist = await this.artistRepo.findOne({ where: { id: artistId } });
    if (!artist) throw new BadRequestException('Artist not found');

    artist.loginEnabled = enabled;
    await this.artistRepo.save(artist);
  }

  async findAll() {
    const users = await this.adminRepo.find({ order: { createdAt: 'ASC' } });
    return users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      createdAt: u.createdAt,
    }));
  }

  async createUser(username: string, email: string, password: string) {
    const hash = await bcrypt.hash(password, 12);
    const user = await this.adminRepo.save({
      username,
      email,
      passwordHash: hash,
    });
    return { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt };
  }

  async updateUser(userId: number, data: { username?: string; email?: string; password?: string }) {
    const user = await this.adminRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    if (data.username !== undefined) user.username = data.username;
    if (data.email !== undefined) user.email = data.email;
    if (data.password) {
      user.passwordHash = await bcrypt.hash(data.password, 12);
      user.mustChangePassword = true;
    }

    await this.adminRepo.save(user);
    return { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt };
  }

  async removeUser(userId: number, requesterId: number) {
    if (userId === requesterId) {
      throw new BadRequestException('Cannot delete your own account');
    }
    const count = await this.adminRepo.count();
    if (count <= 1) {
      throw new BadRequestException('Cannot delete the last admin user');
    }
    const user = await this.adminRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    await this.adminRepo.remove(user);
  }

  async requestPasswordReset(email: string) {
    const user = await this.adminRepo.findOne({ where: { email } });
    if (!user) {
      // Don't reveal whether the email exists
      return;
    }

    const secret = this.configService.get<string>('JWT_SECRET');
    const timestamp = Date.now();
    const data = `${user.id}:${timestamp}:${user.passwordHash.slice(-8)}`;
    const hmac = crypto.createHmac('sha256', secret!).update(data).digest('hex');
    const token = Buffer.from(`${user.id}:${timestamp}:${hmac}`).toString('base64url');

    const publicUrl = this.configService.get('PUBLIC_URL', 'http://localhost:3000');
    const resetLink = `${publicUrl}/admin/reset-password?token=${token}`;

    await this.sendEmail(
      email,
      'Password Reset - Gallery Admin',
      `<p>You requested a password reset.</p>
       <p><a href="${resetLink}">Click here to reset your password</a></p>
       <p>This link expires in 1 hour.</p>
       <p>If you didn't request this, ignore this email.</p>`,
    );
  }

  async resetPassword(token: string, newPassword: string) {
    const secret = this.configService.get<string>('JWT_SECRET');

    let decoded: string;
    try {
      decoded = Buffer.from(token, 'base64url').toString();
    } catch {
      throw new BadRequestException('Invalid reset token');
    }

    const parts = decoded.split(':');
    if (parts.length !== 3) throw new BadRequestException('Invalid reset token');

    const [userIdStr, timestampStr, hmac] = parts;

    const userId = parseInt(userIdStr, 10);
    const user = await this.adminRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('Invalid reset token');

    // Recompute HMAC including current passwordHash — token is invalid if password already changed
    const data = `${userIdStr}:${timestampStr}:${user.passwordHash.slice(-8)}`;
    const expectedHmac = crypto.createHmac('sha256', secret!).update(data).digest('hex');

    // Timing-safe comparison with length check
    const hmacBuf = Buffer.from(hmac);
    const expectedBuf = Buffer.from(expectedHmac);
    if (hmacBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(hmacBuf, expectedBuf)) {
      throw new BadRequestException('Invalid reset token');
    }

    const timestamp = parseInt(timestampStr, 10);
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - timestamp > oneHour) {
      throw new BadRequestException('Reset token has expired');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.mustChangePassword = false;
    await this.adminRepo.save(user);
  }

  private async sendEmail(to: string, subject: string, html: string) {
    const host = this.configService.get('SMTP_HOST');
    if (!host) {
      this.logger.warn('SMTP not configured, skipping email send');
      return;
    }

    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(this.configService.get('SMTP_PORT', '587'), 10),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });

    await transporter.sendMail({
      from: this.configService.get('SMTP_FROM', 'gallery@ilia.to'),
      to,
      subject,
      html,
    });
  }
}
