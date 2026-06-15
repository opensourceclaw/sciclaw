/**
 * Search result cache - LRU with TTL
 */
export class SearchCache {
    cache = new Map();
    ttl;
    maxSize;
    constructor(ttl = 3600, maxSize = 100) {
        this.ttl = ttl * 1000; // Convert to milliseconds
        this.maxSize = maxSize;
    }
    /**
     * Generate cache key from query and engines
     */
    getKey(query, engines) {
        return `${engines.sort().join(',')}:${query}`;
    }
    /**
     * Get cached results if available and not expired
     */
    get(query, engines) {
        const key = this.getKey(query, engines);
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        // Check TTL
        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }
        return entry.results;
    }
    /**
     * Store results in cache
     */
    set(query, engines, results) {
        const key = this.getKey(query, engines);
        // Evict oldest if at max size
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }
        this.cache.set(key, {
            results,
            timestamp: Date.now(),
        });
    }
    /**
     * Clear all cached entries
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Get cache statistics
     */
    stats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            ttl: this.ttl / 1000,
        };
    }
    /**
     * Clean expired entries
     */
    cleanExpired() {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.ttl) {
                this.cache.delete(key);
                cleaned++;
            }
        }
        return cleaned;
    }
}
// Global cache instance
let globalCache = null;
export function getCache(ttl, maxSize) {
    if (!globalCache) {
        globalCache = new SearchCache(ttl, maxSize);
    }
    return globalCache;
}
export function clearCache() {
    globalCache?.clear();
}
//# sourceMappingURL=index.js.map