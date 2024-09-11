import { kv } from "@vercel/kv";
import { interfaces } from "@across-protocol/sdk";

const {
  KV_REST_API_READ_ONLY_TOKEN,
  KV_REST_API_TOKEN,
  KV_REST_API_URL,
  KV_URL,
} = process.env;
const isRedisCacheEnabled =
  KV_REST_API_URL && KV_REST_API_TOKEN && KV_REST_API_READ_ONLY_TOKEN && KV_URL;

export class RedisCache implements interfaces.CachingMechanismInterface {
  async get<T>(key: string): Promise<T | null> {
    if (!isRedisCacheEnabled) {
      return null;
    }

    const value = await kv.get(key);
    if (value === null || value === undefined) {
      return null;
    }
    return value as T;
  }

  async set<T>(key: string, value: T, ttl = 10): Promise<string | undefined> {
    if (!isRedisCacheEnabled) {
      return;
    }

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
  fetcher: () => Promise<T>,
  parser?: (value: T) => T
): Promise<T> {
  const cachedValue = await redisCache.get<T>(key);
  if (cachedValue) {
    return parser ? parser(cachedValue) : cachedValue;
  }

  const value = await fetcher();
  await redisCache.set(key, value, ttl);
  return value;
}

export function makeCacheGetterAndSetter<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
  parser?: (value: T) => T
) {
  return {
    get: async () => {
      return getCachedValue(key, ttl, fetcher, parser);
    },
    set: async () => {
      const value = await fetcher();
      await redisCache.set(key, value, ttl);
    },
  };
}
