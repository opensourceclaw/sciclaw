import type { SearchResult, SearchEngine } from '../types/index.js';

export interface CacheEntry {
  compressedData: string;
  timestamp: number;
  accessCount: number;
  lastAccessSeq: number;  // monotonic sequence for LRU ordering
  lastAccessTime: number; // wall-clock timestamp for gap calculation
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
  topKeys: Array<{ key: string; hits: number }>;
  periodStart: number;
}

export interface CacheAnalyticsConfig {
  enabled: boolean;
  sampleRate: number;
  topKLimit: number;
  maxKeysInMemory: number;
  flushIntervalMs: number;
}

export const DEFAULT_ANALYTICS_CONFIG: CacheAnalyticsConfig = {
  enabled: true,
  sampleRate: 1.0,
  topKLimit: 10,
  maxKeysInMemory: 10000,
  flushIntervalMs: 60000,
};

export type InvalidationStrategy =
  | "ttl"
  | "topic_aware"
  | "source_aware"
  | "adaptive";

export interface InvalidationConfig {
  strategy: InvalidationStrategy;
  defaultTTL: number;
  sourceTTLs: Partial<Record<SearchEngine, number>>;
  topicWindowMs: number;
  minTTL: number;
  maxTTL: number;
}

export const DEFAULT_INVALIDATION_CONFIG: InvalidationConfig = {
  strategy: "adaptive",
  defaultTTL: 3600,
  sourceTTLs: {},
  topicWindowMs: 1800000,
  minTTL: 300,
  maxTTL: 86400,
};

export interface CompressionConfig {
  enabled: boolean;
  algorithm: "json" | "msgpack";
  minBytesToCompress: number;
  level: "fast" | "balanced";
}

export const DEFAULT_COMPRESSION_CONFIG: CompressionConfig = {
  enabled: true,
  algorithm: "json",
  minBytesToCompress: 1024,
  level: "fast",
};

export interface WarmerConfig {
  enabled: boolean;
  queries: string[];
  engines: SearchEngine[];
  concurrency: number;
  timeoutMs: number;
  topKFromAnalytics: boolean;
  topKLimit: number;
}

export const DEFAULT_WARMER_CONFIG: WarmerConfig = {
  enabled: true,
  queries: [],
  engines: ["duckduckgo"],
  concurrency: 2,
  timeoutMs: 10000,
  topKFromAnalytics: true,
  topKLimit: 10,
};

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

export const DEFAULT_DISTRIBUTED_CONFIG: DistributedCacheConfig = {
  enabled: false,
  redis: {
    host: "127.0.0.1",
    port: 6379,
    db: 0,
    keyPrefix: "deepclaw:cache:",
    connectTimeoutMs: 2000,
    maxRetries: 3,
  },
  fallback: "local",
};

export interface CacheConfig {
  ttl: number;
  maxSize: number;
  analytics?: Partial<CacheAnalyticsConfig>;
  invalidation?: Partial<InvalidationConfig>;
  compression?: Partial<CompressionConfig>;
  warmer?: Partial<WarmerConfig>;
  distributed?: Partial<DistributedCacheConfig>;
}

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 3600,
  maxSize: 100,
};
