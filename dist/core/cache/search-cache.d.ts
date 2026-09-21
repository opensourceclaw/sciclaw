import type { SearchResult } from "../types/index.js";
import { CacheAnalytics } from "./analytics.js";
import { type SearchFn } from "./warmer.js";
import { DistributedCache } from "./distributed.js";
import type { CacheConfig, CacheMetrics, WarmerConfig } from "./types.js";
export declare class SearchCache {
    private cache;
    private analytics;
    private invalidation;
    private compressor;
    private warmer;
    private distributed;
    private ttl;
    private maxSize;
    private accessSeq;
    constructor(config?: Partial<CacheConfig>);
    /** Attach a warmer after construction (needs search function). */
    setWarmer(searchFn: SearchFn, config?: Partial<WarmerConfig>): void;
    /** Connect distributed cache. Call during bootstrap. */
    connectDistributed(): Promise<boolean>;
    /** Warm the cache. Call during bootstrap. */
    warm(): Promise<{
        warmed: number;
        failed: number;
        durationMs: number;
    }>;
    get(query: string, engines: string[]): Promise<SearchResult[] | null>;
    set(query: string, engines: string[], results: SearchResult[]): void;
    invalidate(query: string, engines: string[]): boolean;
    clear(): void;
    getMetrics(): CacheMetrics;
    getStats(): {
        size: number;
        maxSize: number;
        ttl: number;
        hitRate: number;
    };
    cleanExpired(): number;
    getAnalytics(): CacheAnalytics;
    getDistributed(): DistributedCache | null;
    dispose(): Promise<void>;
    /**
     * Generate cache key from query and engines
     */
    getKey(query: string, engines: string[]): string;
    private evictLRU;
}
//# sourceMappingURL=search-cache.d.ts.map