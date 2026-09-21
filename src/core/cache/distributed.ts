import type { SearchResult } from "../types/index.js";
import { DEFAULT_DISTRIBUTED_CONFIG } from "./types.js";
import type { DistributedCacheConfig } from "./types.js";
import type { CacheCompressor } from "./compression.js";

export interface RedisLike {
  connect?: () => Promise<void>;
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<unknown>;
  quit(): Promise<void>;
  on(event: string, handler: () => void): void;
}

export type RedisFactory = (opts: Record<string, unknown>) => RedisLike;

export class DistributedCache {
  private redis: RedisLike | null = null;
  private healthy = false;
  private reconnectTimer: ReturnType<typeof setInterval> | null = null;
  private redisFactory: RedisFactory | null = null;

  constructor(
    private config: DistributedCacheConfig = { ...DEFAULT_DISTRIBUTED_CONFIG },
    private compressor: CacheCompressor,
    redisFactory?: RedisFactory,
  ) {
    this.redisFactory = redisFactory ?? null;
  }

  async connect(): Promise<boolean> {
    if (!this.config.enabled || !this.config.redis) return false;

    try {
      let factory: RedisFactory;

      if (this.redisFactory) {
        factory = this.redisFactory;
      } else {
        try {
          const mod: any = await import("ioredis");
          factory = (mod.default ?? mod.Redis) as RedisFactory;
        } catch {
          try {
            const mod: any = await import("redis");
            factory = (mod.default ?? mod.Redis) as RedisFactory;
          } catch {
            return false;
          }
        }
      }

      const r = this.config.redis;
      const redis = factory({
        host: r.host,
        port: r.port,
        password: r.password ?? undefined,
        db: r.db ?? 0,
        keyPrefix: r.keyPrefix ?? undefined,
        connectTimeout: r.connectTimeoutMs,
        maxRetriesPerRequest: r.maxRetries,
        lazyConnect: true,
      });

      if (redis.connect) {
        await redis.connect();
      }
      this.redis = redis;
      this.healthy = true;

      redis.on("error", () => this.markUnhealthy());
      this.startReconnect();
      return true;
    } catch {
      this.healthy = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch {
        // ok
      }
      this.redis = null;
    }
    this.healthy = false;
  }

  async get(key: string): Promise<SearchResult[] | null> {
    if (!this.healthy || !this.redis) return null;

    try {
      const raw = await this.redis.get(key);
      if (!raw) return null;
      return this.compressor.decompress(raw);
    } catch {
      this.markUnhealthy();
      return null;
    }
  }

  async set(key: string, results: SearchResult[], ttl: number): Promise<void> {
    if (!this.healthy || !this.redis) return;

    try {
      const { data } = this.compressor.compress(results);
      await this.redis.setex(key, ttl, data);
    } catch {
      this.markUnhealthy();
    }
  }

  isHealthy(): boolean {
    return this.healthy;
  }

  private markUnhealthy(): void {
    this.healthy = false;
  }

  private startReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setInterval(() => {
      if (!this.healthy && this.config.enabled) {
        this.connect().catch(() => {});
      }
    }, 30_000);
  }
}
