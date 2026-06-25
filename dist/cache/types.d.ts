import type { SearchEngine } from '../types/index.js';
export interface CacheEntry {
    compressedData: string;
    timestamp: number;
    accessCount: number;
    lastAccessSeq: number;
    lastAccessTime: number;
}
export interface CacheMetrics {
    hits: number;
    misses: number;
    hitRate: number;
    avgLatencySavedMs: number;
    totalRequests: number;
    evictions: number;
    memoryBytes: number;
    compressedBytes: number;
    topKeys: Array<{
        key: string;
        hits: number;
    }>;
    periodStart: number;
}
export interface CacheAnalyticsConfig {
    enabled: boolean;
    sampleRate: number;
    topKLimit: number;
    maxKeysInMemory: number;
    flushIntervalMs: number;
}
export declare const DEFAULT_ANALYTICS_CONFIG: CacheAnalyticsConfig;
export type InvalidationStrategy = "ttl" | "topic_aware" | "source_aware" | "adaptive";
export interface InvalidationConfig {
    strategy: InvalidationStrategy;
    defaultTTL: number;
    sourceTTLs: Partial<Record<SearchEngine, number>>;
    topicWindowMs: number;
    minTTL: number;
    maxTTL: number;
}
export declare const DEFAULT_INVALIDATION_CONFIG: InvalidationConfig;
export interface CompressionConfig {
    enabled: boolean;
    algorithm: "json" | "msgpack";
    minBytesToCompress: number;
    level: "fast" | "balanced";
}
export declare const DEFAULT_COMPRESSION_CONFIG: CompressionConfig;
export interface WarmerConfig {
    enabled: boolean;
    queries: string[];
    engines: SearchEngine[];
    concurrency: number;
    timeoutMs: number;
    topKFromAnalytics: boolean;
    topKLimit: number;
}
export declare const DEFAULT_WARMER_CONFIG: WarmerConfig;
export interface DistributedCacheConfig {
    enabled: boolean;
    redis?: {
        host: string;
        port: number;
        password?: string;
        db?: number;
        keyPrefix?: string;
        connectTimeoutMs: number;
        maxRetries: number;
    };
    fallback: "local" | "error";
}
export declare const DEFAULT_DISTRIBUTED_CONFIG: DistributedCacheConfig;
export interface CacheConfig {
    ttl: number;
    maxSize: number;
    analytics?: Partial<CacheAnalyticsConfig>;
    invalidation?: Partial<InvalidationConfig>;
    compression?: Partial<CompressionConfig>;
    warmer?: Partial<WarmerConfig>;
    distributed?: Partial<DistributedCacheConfig>;
}
export declare const DEFAULT_CACHE_CONFIG: CacheConfig;
//# sourceMappingURL=types.d.ts.map