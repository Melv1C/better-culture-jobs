import { env } from './env';
import { createClient, type RedisClientType } from 'redis';

type MemoryCacheEntry = {
  value: string;
  expiresAt: number;
};

const memoryCache = new Map<string, MemoryCacheEntry>();

let redisClient: RedisClientType | null = null;
let hasLoggedRedisError = false;
let lastRedisInitAttemptAt = 0;
const REDIS_RECONNECT_THROTTLE_MS = 30_000;

function cleanupExpiredMemoryEntries() {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }
}

const cleanupInterval = setInterval(cleanupExpiredMemoryEntries, 60_000);
cleanupInterval.unref();

function getMemoryCache<T>(key: string): T | null {
  const cached = memoryCache.get(key);
  if (!cached) return null;

  if (cached.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }

  try {
    return JSON.parse(cached.value) as T;
  } catch {
    memoryCache.delete(key);
    return null;
  }
}

function setMemoryCache<T>(key: string, value: T, ttlSeconds: number): void {
  memoryCache.set(key, {
    value: JSON.stringify(value),
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

function initializeRedisClient(): void {
  if (!env.REDIS_URL || redisClient) return;

  redisClient = createClient({ url: env.REDIS_URL });

  redisClient.on('error', error => {
    if (!hasLoggedRedisError) {
      hasLoggedRedisError = true;
      console.warn('Redis error detected, cache operations will fallback to memory.', error);
    }
  });

  redisClient.on('ready', () => {
    hasLoggedRedisError = false;
  });

  void redisClient.connect().catch(error => {
    console.warn('Failed to connect to Redis, cache operations will fallback to memory.', error);
    redisClient = null;
  });
}

function ensureRedisClient(): void {
  if (!env.REDIS_URL || redisClient) return;

  const now = Date.now();
  if (now - lastRedisInitAttemptAt < REDIS_RECONNECT_THROTTLE_MS) return;
  lastRedisInitAttemptAt = now;
  initializeRedisClient();
}

ensureRedisClient();

export async function getCachedValue<T>(key: string): Promise<T | null> {
  ensureRedisClient();

  if (redisClient?.isOpen) {
    try {
      const cached = await redisClient.get(key);
      if (!cached) return null;
      return JSON.parse(cached) as T;
    } catch {
      // Fallback to process memory cache if Redis command fails.
    }
  }

  return getMemoryCache<T>(key);
}

export async function setCachedValue<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  ensureRedisClient();

  if (redisClient?.isOpen) {
    try {
      await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
      return;
    } catch {
      // Fallback to process memory cache if Redis command fails.
    }
  }

  setMemoryCache(key, value, ttlSeconds);
}
