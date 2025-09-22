import { createClient } from 'redis';
import { env } from './env';
import { logger } from '../utils/logger';

const redisUrl = env.redis.url || `redis://${env.redis.host}:${env.redis.port}`;

export const redis = createClient({
  url: redisUrl,
  password: env.redis.password,
});

redis.on('error', (err) => logger.error('Redis Client Error', { err }));
redis.on('connect', () => logger.info('Redis connected'));
redis.on('reconnecting', () => logger.warn('Redis reconnecting'));

export async function connectRedis(): Promise<void> {
  if (!redis.isOpen) {
    await redis.connect();
  }
}
