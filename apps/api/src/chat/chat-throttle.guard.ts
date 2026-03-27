import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class ChatThrottleGuard implements CanActivate {
  private readonly timestamps = new Map<string, number>();
  private readonly THROTTLE_MS = 5000;
  private readonly MAX_ENTRIES = 10_000;

  constructor() {
    setInterval(() => {
      const now = Date.now();
      for (const [ip, timestamp] of this.timestamps) {
        if (now - timestamp > 60_000) {
          this.timestamps.delete(ip);
        }
      }
    }, 60_000).unref();
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip: string = request.ip ?? 'unknown';

    const now = Date.now();
    const lastRequest = this.timestamps.get(ip);

    if (lastRequest && now - lastRequest < this.THROTTLE_MS) {
      throw new HttpException(
        'Please wait a few seconds before sending another message.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (this.timestamps.size >= this.MAX_ENTRIES) {
      this.timestamps.delete(this.timestamps.keys().next().value!);
    }
    this.timestamps.set(ip, now);
    return true;
  }
}
