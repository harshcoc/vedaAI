import Redis from 'ioredis';
import { env } from './env';

let redis: Redis | null = null;
let redisAvailable = false;

try {
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      // Only retry 3 times on initial connect, then give up
      if (times > 3) {
        console.warn('⚠️ Redis not available — running without cache and queue');
        return null; // Stop retrying
      }
      return Math.min(times * 200, 1000);
    },
    lazyConnect: true, // Don't connect immediately
  });

  redis.on('connect', () => {
    redisAvailable = true;
    console.log('✅ Redis connected successfully');
  });

  redis.on('error', () => {
    // Silently handle — we already log in retryStrategy
    redisAvailable = false;
  });

  redis.on('close', () => {
    redisAvailable = false;
  });
} catch {
  console.warn('⚠️ Redis client could not be created — running without cache');
}

/**
 * Try to connect to Redis. If it fails, the server continues without it.
 */
export async function connectRedis(): Promise<void> {
  if (!redis) return;
  try {
    await redis.connect();
  } catch {
    console.warn('⚠️ Could not connect to Redis — caching and queues disabled');
    redisAvailable = false;
  }
}

export function isRedisAvailable(): boolean {
  return redisAvailable;
}

export { redis };
