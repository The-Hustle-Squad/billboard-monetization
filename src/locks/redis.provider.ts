import { Provider, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): Redis => {
    const logger = new Logger('RedisProvider');
    const host = config.get<string>('REDIS_HOST', 'localhost');
    const port = parseInt(config.get<string>('REDIS_PORT', '6379'), 10);
    const password = config.get<string>('REDIS_PASSWORD') || undefined;
    const username = config.get<string>('REDIS_USER') || undefined;

    // Only enable TLS when explicitly requested. Auto-TLS on remote hosts breaks
    // plain-TCP endpoints (OpenSSL: "wrong version number").
    const useTls = config.get<string>('REDIS_TLS') === 'true';

    const client = new Redis({
      host,
      port,
      password,
      ...(username ? { username } : {}),
      ...(useTls ? { tls: {} } : {}),
      lazyConnect: true,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    });

    client.on('connect', () => logger.log('Redis connected'));
    client.on('error', (err: Error) => logger.error(`Redis error: ${err.message}`));

    return client;
  },
};
