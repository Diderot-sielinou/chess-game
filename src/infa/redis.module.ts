// src/redis/redis.module.ts
import { Module, Global, Provider } from '@nestjs/common';
import Redis from 'ioredis';

export const RedisProvider: Provider = {
  // Le nom du token d'injection
  provide: 'REDIS',
  useFactory: () => {
    // Crée une nouvelle instance de Redis
    const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

    // Gère les erreurs de connexion Redis
    client.on('error', (e) => {
      console.error('Redis connection error', e);
    });

    return client;
  },
};

@Global()
@Module({
  providers: [RedisProvider],
  exports: [RedisProvider],
})
export class RedisModule {}
