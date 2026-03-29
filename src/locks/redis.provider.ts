import { Provider, Logger } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: (): Redis => {
    const logger = new Logger('RedisProvider');

    const client = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    });

    client.on('connect', () => logger.log('Redis connected'));
    client.on('error', (err: Error) => logger.error(`Redis error: ${err.message}`));

    return client;
  },
};
