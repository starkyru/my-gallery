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
  private readonly dailyCounts = new Map<string, { count: number; resetsAt: number }>();
  private readonly THROTTLE_MS = 5000;
  private readonly DAILY_LIMIT = 50;
  private readonly MAX_ENTRIES = 10_000;

  constructor() {
    setInterval(() => {
      const now = Date.now();
      for (const [ip, timestamp] of this.timestamps) {
        if (now - timestamp > 60_000) {
          this.timestamps.delete(ip);
        }
      }
      for (const [ip, entry] of this.dailyCounts) {
        if (now > entry.resetsAt) {
          this.dailyCounts.delete(ip);
        }
      }
    }, 60_000).unref();
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip: string = request.ip ?? 'unknown';
    const now = Date.now();

    // Per-request throttle (5s between requests)
    const lastRequest = this.timestamps.get(ip);
    if (lastRequest && now - lastRequest < this.THROTTLE_MS) {
      throw new HttpException(
        'Please wait a few seconds before sending another message.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Daily cap per IP
    const daily = this.dailyCounts.get(ip);
    if (daily && now < daily.resetsAt && daily.count >= this.DAILY_LIMIT) {
      throw new HttpException(
        'Daily message limit reached. Please try again tomorrow.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Update timestamps
    if (this.timestamps.size >= this.MAX_ENTRIES) {
      this.timestamps.delete(this.timestamps.keys().next().value!);
    }
    this.timestamps.set(ip, now);

    // Update daily count
    if (daily && now < daily.resetsAt) {
      daily.count++;
    } else {
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      this.dailyCounts.set(ip, { count: 1, resetsAt: midnight.getTime() });
    }

    return true;
  }
}
