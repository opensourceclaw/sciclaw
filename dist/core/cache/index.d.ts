export { SearchCache } from "./search-cache.js";
export { CacheAnalytics } from "./analytics.js";
export { InvalidationManager } from "./invalidation.js";
export { CacheCompressor } from "./compression.js";
export { CacheWarmer } from "./warmer.js";
export { DistributedCache } from "./distributed.js";
export type { CacheConfig, CacheMetrics, CacheAnalyticsConfig, InvalidationConfig, CompressionConfig, WarmerConfig, DistributedCacheConfig, CacheEntry, InvalidationStrategy, } from "./types.js";
import { SearchCache } from "./search-cache.js";
export declare function getCache(ttl?: number, maxSize?: number): SearchCache;
export declare function clearCache(): void;
export declare function setGlobalCache(cache: SearchCache): void;
//# sourceMappingURL=index.d.ts.map