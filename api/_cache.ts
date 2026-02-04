import { createClient, VercelKV } from "@vercel/kv";
import { interfaces } from "@across-protocol/sdk";
import { getEnvs } from "./_env";
import { compactAxiosError, getLogger } from "./_utils";

const {
  KV_REST_API_READ_ONLY_TOKEN,
  KV_REST_API_TOKEN,
  KV_REST_API_URL,
  UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN,
  UPSTASH_REDIS_READ_ONLY_TOKEN,
  CACHE_PREFIX,
  VERCEL_ENV,
  VERCEL_URL,
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

  async del(...keys: string[]) {
    if (!this.client) {
      return;
    }
    await this.client.del(...keys);
  }

  pub(_channel: string, _message: string): Promise<number> {
    throw new Error("pub: not supported");
  }

  async sub(
    _channel: string,
    _listener: (message: string, channel: string) => void
  ): Promise<number> {
    throw new Error("sub: not supported");
  }

  /**
   * Add members to a set.
   * @returns Number of members added (not already in set), or null if client unavailable
   */
  async sadd(key: string, ...members: string[]): Promise<number | null> {
    if (!this.client || members.length === 0) {
      return null;
    }
    try {
      return await this.client.sadd(key, ...members);
    } catch (error) {
      console.error("[RedisCache] Error while calling sadd:", error);
      throw error;
    }
  }

  /**
   * Get all members of a set.
   * @returns Array of members, or empty array if client unavailable
   */
  async smembers(key: string): Promise<string[]> {
    if (!this.client) {
      return [];
    }
    try {
      return await this.client.smembers(key);
    } catch (error) {
      console.error("[RedisCache] Error while calling smembers:", error);
      throw error;
    }
  }

  /**
   * Remove members from a set.
   * @returns Number of members removed, or null if client unavailable
   */
  async srem(key: string, ...members: string[]): Promise<number | null> {
    if (!this.client || members.length === 0) {
      return null;
    }
    try {
      return await this.client.srem(key, ...members);
    } catch (error) {
      console.error("[RedisCache] Error while calling srem:", error);
      throw error;
    }
  }

  /**
   * Get multiple keys at once.
   * @returns Array of values (null for missing keys), or empty array if client unavailable
   */
  async mget<T>(...keys: string[]): Promise<(T | null)[]> {
    if (!this.client || keys.length === 0) {
      return [];
    }
    try {
      return await this.client.mget<(T | null)[]>(...keys);
    } catch (error) {
      console.error("[RedisCache] Error while calling mget:", error);
      throw error;
    }
  }
}

export const redisCache = new RedisCache();

// For some reason, the upstash client seems to strip the quote characters from the value.
// This is a workaround to add the quote characters back to the value so the provider responses won't fail to parse.
export class ProviderRedisCache extends RedisCache {
  async get<T>(key: string): Promise<T | null> {
    const value = await super.get<T>(key);
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === "string") {
      return ('"' + value + '"') as T;
    } else if (typeof value === "object") {
      // Convert object back to JSON string for the provider to parse
      return JSON.stringify(value) as T;
    }
    return value;
  }
}

export const providerRedisCache = new ProviderRedisCache();

export function buildCacheKey(
  prefix: string,
  ...args: (string | number)[]
): string {
  return `${prefix}:${args.join(":")}`;
}

export function buildInternalCacheKey(...args: (string | number)[]): string {
  const defaultCachePrefix =
    VERCEL_ENV === "production" ? "" : `${VERCEL_URL}_`;
  const cachePrefix = CACHE_PREFIX ? CACHE_PREFIX + "_" : defaultCachePrefix;

  return buildCacheKey(`${cachePrefix}QUOTES_API`, ...args);
}

export async function getCachedValue<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
  parser?: (value: T) => T
): Promise<T> {
  let cachedValue = null;
  try {
    cachedValue = await redisCache.get<T>(key);
  } catch (error) {
    getLogger().error({
      at: "getCachedValue",
      message: "Error while calling redisCache.get",
      error: compactAxiosError(error as Error),
    });
  }

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
