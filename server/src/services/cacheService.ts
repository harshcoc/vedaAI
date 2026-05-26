import { isRedisAvailable } from '../config/redis';

// In-memory fallback cache when Redis is not available
const memoryCache = new Map<string, { data: string; expiry: number }>();

function memGet(key: string): string | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data;
}

function memSet(key: string, value: string, ttlSeconds: number): void {
  memoryCache.set(key, { data: value, expiry: Date.now() + ttlSeconds * 1000 });
}

function memDel(key: string): void {
  memoryCache.delete(key);
}

const DEFAULT_PAPER_TTL = 3600;   // 1 hour
const DEFAULT_LIST_TTL = 300;     // 5 minutes

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      let data: string | null = null;

      if (isRedisAvailable()) {
        const { redis } = await import('../config/redis');
        data = redis ? await redis.get(key) : null;
      } else {
        data = memGet(key);
      }

      if (!data) return null;
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttl: number = 300): Promise<void> {
    const serialized = JSON.stringify(value);
    try {
      if (isRedisAvailable()) {
        const { redis } = await import('../config/redis');
        if (redis) await redis.set(key, serialized, 'EX', ttl);
      } else {
        memSet(key, serialized, ttl);
      }
    } catch {
      // Fallback to memory
      memSet(key, serialized, ttl);
    }
  },

  async del(key: string): Promise<void> {
    try {
      if (isRedisAvailable()) {
        const { redis } = await import('../config/redis');
        if (redis) await redis.del(key);
      }
      memDel(key);
    } catch {
      memDel(key);
    }
  },

  async getAssignmentList(userId: string): Promise<unknown[] | null> {
    return this.get<unknown[]>(`assignments:list:${userId}`);
  },

  async setAssignmentList(userId: string, assignments: unknown[]): Promise<void> {
    await this.set(`assignments:list:${userId}`, assignments, DEFAULT_LIST_TTL);
  },

  async invalidateAssignmentList(userId: string): Promise<void> {
    await this.del(`assignments:list:${userId}`);
  },

  async getGeneratedPaper(assignmentId: string): Promise<unknown | null> {
    return this.get(`paper:${assignmentId}`);
  },

  async setGeneratedPaper(assignmentId: string, paper: unknown): Promise<void> {
    await this.set(`paper:${assignmentId}`, paper, DEFAULT_PAPER_TTL);
  },

  async invalidateGeneratedPaper(assignmentId: string): Promise<void> {
    await this.del(`paper:${assignmentId}`);
  },
};
