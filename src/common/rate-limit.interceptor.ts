// src/common/interceptors/rate-limit.interceptor.ts

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RedisService } from 'src/redis/v1/redis.service';

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  constructor(private readonly redisService: RedisService) {}

  private limit = 10;
  private windowInSeconds = 60;

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const ip = request.ip;
    const key = `rate-limit:${ip}`;

    const redis = this.redisService.getClient();

    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, this.windowInSeconds);
    }

    if (current > this.limit) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      throw new HttpException(
        'Rate limit exceeded. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return next.handle();
  }
}
