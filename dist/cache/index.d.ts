/**
 * Search result cache - LRU with TTL
 */
import type { SearchResult } from '../types/index.js';
export declare class SearchCache {
    private cache;
    private ttl;
    private maxSize;
    constructor(ttl?: number, maxSize?: number);
    /**
     * Generate cache key from query and engines
     */
    private getKey;
    /**
     * Get cached results if available and not expired
     */
    get(query: string, engines: string[]): SearchResult[] | null;
    /**
     * Store results in cache
     */
    set(query: string, engines: string[], results: SearchResult[]): void;
    /**
     * Clear all cached entries
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    stats(): {
        size: number;
        maxSize: number;
        ttl: number;
    };
    /**
     * Clean expired entries
     */
    cleanExpired(): number;
}
export declare function getCache(ttl?: number, maxSize?: number): SearchCache;
export declare function clearCache(): void;
//# sourceMappingURL=index.d.ts.map