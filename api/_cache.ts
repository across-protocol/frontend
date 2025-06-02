import { createClient, VercelKV } from "@vercel/kv";
import { interfaces } from "@across-protocol/sdk";
import { getEnvs } from "./_env";

const {
  KV_REST_API_READ_ONLY_TOKEN,
  KV_REST_API_TOKEN,
  KV_REST_API_URL,
  UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN,
  UPSTASH_REDIS_READ_ONLY_TOKEN,
  CACHE_PREFIX,
  VERCEL_ENV,
} = getEnvs();

const isRedisCacheEnabled =
  (KV_REST_API_URL && (KV_REST_API_TOKEN || KV_REST_API_READ_ONLY_TOKEN)) ||
  (UPSTASH_REDIS_REST_URL &&
    (UPSTASH_REDIS_REST_TOKEN || UPSTASH_REDIS_READ_ONLY_TOKEN));

export class RedisCache implements interfaces.CachingMechanismInterface {
  private client: VercelKV | undefined;

  constructor() {
    this.client = isRedisCacheEnabled
      ? createClient({
          url: UPSTASH_REDIS_REST_URL || KV_REST_API_URL,
          token: UPSTASH_REDIS_REST_TOKEN || KV_REST_API_TOKEN,
        })
      : undefined;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) {
      return null;
    }

    const value = await this.client.get(key);
    if (value === null || value === undefined) {
      return null;
    }
    return value as T;
  }

  async set<T>(key: string, value: T, ttl = 10): Promise<string | undefined> {
    if (!this.client) {
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
      await this.client.set(key, value, {
        ex: ttl === Number.POSITIVE_INFINITY ? 60 : ttl,
      });
      return key;
    } catch (error) {
      console.error("[RedisCache] Error while calling set:", error);
      throw error;
    }
  }

  async del(key: string) {
    if (!this.client) {
      return;
    }
    await this.client.del(key);
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
  const defaultCachePrefix =
    VERCEL_ENV === "production" ? "" : `${VERCEL_ENV}_`;
  const cachePrefix = CACHE_PREFIX ? CACHE_PREFIX + "_" : defaultCachePrefix;

  return buildCacheKey(`${cachePrefix}QUOTES_API`, ...args);
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
    set: async (value?: T) => {
      if (!value) {
        value = await fetcher();
      }
      await redisCache.set(key, value, ttl);
    },
  };
}
