import { Provider } from '@nestjs/common';
import Redis from 'ioredis';

export const RedisProvider: Provider = {
  provide: 'REDIS',
  useFactory: () => {
    const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    client.on('error', (e) => console.error('Redis error', e));
    return client;
  },
};
