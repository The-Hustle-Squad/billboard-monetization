import { Module } from '@nestjs/common';
import { RedisProvider } from './redis.provider';
import { LockService } from './lock.service';

@Module({
  providers: [RedisProvider, LockService],
  exports: [LockService],
})
export class LockModule {}
