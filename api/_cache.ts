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
      if (typeof value === "string") {
        try {
          const parsedJson = JSON.parse(value);
          value = parsedJson;
        } catch (error) {
          // Do nothing
        }
      }
      await kv.set(key, value, {
        ex: ttl === Number.POSITIVE_INFINITY ? 60 : ttl,
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
