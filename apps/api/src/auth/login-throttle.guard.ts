import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class LoginThrottleGuard implements CanActivate {
  private readonly attempts = new Map<string, number>();
  private readonly THROTTLE_MS = 1000;
  private readonly MAX_ENTRIES = 10_000;

  constructor() {
    setInterval(() => {
      const now = Date.now();
      for (const [username, timestamp] of this.attempts) {
        if (now - timestamp > 60_000) {
          this.attempts.delete(username);
        }
      }
    }, 60_000).unref();
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const raw = request.body?.username;
    if (!raw || typeof raw !== 'string') return true;

    const username = raw.trim().toLowerCase().slice(0, 255);
    if (!username) return true;

    const now = Date.now();
    const lastAttempt = this.attempts.get(username);

    if (lastAttempt && now - lastAttempt < this.THROTTLE_MS) {
      throw new HttpException(
        'Too many login attempts. Please wait a moment.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (this.attempts.size >= this.MAX_ENTRIES) {
      this.attempts.delete(this.attempts.keys().next().value!);
    }
    this.attempts.set(username, now);
    return true;
  }
}
