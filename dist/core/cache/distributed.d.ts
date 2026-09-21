import type { SearchResult } from "../types/index.js";
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
export declare class DistributedCache {
    private config;
    private compressor;
    private redis;
    private healthy;
    private reconnectTimer;
    private redisFactory;
    constructor(config: DistributedCacheConfig | undefined, compressor: CacheCompressor, redisFactory?: RedisFactory);
    connect(): Promise<boolean>;
    disconnect(): Promise<void>;
    get(key: string): Promise<SearchResult[] | null>;
    set(key: string, results: SearchResult[], ttl: number): Promise<void>;
    isHealthy(): boolean;
    private markUnhealthy;
    private startReconnect;
}
//# sourceMappingURL=distributed.d.ts.map