// redis/redis.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);

    this.client = new Redis({ host, port });
  }

  async set(key: string, value: string, ttlInSeconds = 3600): Promise<'OK'> {
    return this.client.set(key, value, 'EX', ttlInSeconds);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  getClient(): Redis {
    return this.client;
  }

  onModuleDestroy() {
    this.client.quit();
  }
}
