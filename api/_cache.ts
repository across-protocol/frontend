import { kv } from "@vercel/kv";
import { interfaces } from "@across-protocol/sdk";

export class RedisCache implements interfaces.CachingMechanismInterface {
  async get<T>(key: string): Promise<T | null> {
    const value = await kv.get(key);
    if (value === null || value === undefined) {
      return null;
    }
    return value as T;
  }

  async set<T>(key: string, value: T, ttl = 10): Promise<string | undefined> {
    try {
      await kv.set(key, typeof value === "string" ? JSON.parse(value) : value, {
        ex: ttl === Number.POSITIVE_INFINITY ? 60 : ttl,
        nx: true,
      });
      return key;
    } catch (error) {
      console.error("[RedisCache] Error while calling set:", error);
      throw error;
    }
  }
}

export const redisCache = new RedisCache();

export function buildCacheKey(
  prefix: string,
  ...args: (string | number)[]
): string {
  return `${prefix}:${args.join(":")}`;
}

export function buildInternalCacheKey(...args: (string | number)[]): string {
  return buildCacheKey("QUOTES_API", ...args);
}

export async function getCachedValue<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
) {
  const cachedValue = await redisCache.get<T>(key);
  if (cachedValue) {
    return cachedValue;
  }

  const value = await fetcher();
  await redisCache.set(key, value, ttl);
  return value;
}
