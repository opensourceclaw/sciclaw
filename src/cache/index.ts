export { SearchCache } from "./search-cache.js";
export { CacheAnalytics } from "./analytics.js";
export { InvalidationManager } from "./invalidation.js";
export { CacheCompressor } from "./compression.js";
export { CacheWarmer } from "./warmer.js";
export { DistributedCache } from "./distributed.js";

export type {
  CacheConfig, CacheMetrics,
  CacheAnalyticsConfig, InvalidationConfig, CompressionConfig,
  WarmerConfig, DistributedCacheConfig,
  CacheEntry, InvalidationStrategy,
} from "./types.js";

import { SearchCache } from "./search-cache.js";

// Global singleton — backward compatible with v3.0.x API
let globalCache: SearchCache | null = null;

export function getCache(ttl?: number, maxSize?: number): SearchCache {
  if (!globalCache) {
    globalCache = new SearchCache({ ttl, maxSize });
  }
  return globalCache;
}

export function clearCache(): void {
  globalCache?.clear();
}

export function setGlobalCache(cache: SearchCache): void {
  globalCache = cache;
}
