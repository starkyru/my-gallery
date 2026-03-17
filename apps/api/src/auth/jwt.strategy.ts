import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_SECRET', 'dev-secret-change-me'),
    });
  }

  validate(payload: { sub: number; username: string; role?: string; photographerId?: number }) {
    return {
      id: payload.sub,
      username: payload.username,
      role: payload.role || 'admin',
      photographerId: payload.photographerId,
    };
  }
}
