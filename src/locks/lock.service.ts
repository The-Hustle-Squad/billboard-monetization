import { Injectable, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.provider';

@Injectable()
export class LockService {
  private readonly logger = new Logger(LockService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  buildKey(vendorId: string, slotId: string): string {
    return `lock:${vendorId}:${slotId}`;
  }

  async acquireLock(key: string, lockId: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.redis.set(key, lockId, 'EX', ttlSeconds, 'NX');
    this.logger.debug(`Acquire lock [${key}] → ${result ?? 'null'}`);
    return result === 'OK';
  }

  async releaseLock(key: string): Promise<void> {
    await this.redis.del(key);
    this.logger.debug(`Released lock [${key}]`);
  }

  async getLockValue(key: string): Promise<string | null> {
    return this.redis.get(key);
  }
}
