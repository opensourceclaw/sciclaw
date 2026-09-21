import { CacheAnalytics } from "./analytics.js";
import { InvalidationManager } from "./invalidation.js";
import { CacheCompressor } from "./compression.js";
import { CacheWarmer } from "./warmer.js";
import { DistributedCache } from "./distributed.js";
import { DEFAULT_CACHE_CONFIG, DEFAULT_ANALYTICS_CONFIG, DEFAULT_INVALIDATION_CONFIG, DEFAULT_COMPRESSION_CONFIG, DEFAULT_WARMER_CONFIG, DEFAULT_DISTRIBUTED_CONFIG, } from "./types.js";
export class SearchCache {
    cache = new Map();
    analytics;
    invalidation;
    compressor;
    warmer = null;
    distributed = null;
    ttl;
    maxSize;
    accessSeq = 0;
    constructor(config) {
        const c = { ...DEFAULT_CACHE_CONFIG, ...config };
        this.ttl = c.ttl * 1000;
        this.maxSize = c.maxSize;
        this.analytics = new CacheAnalytics({ ...DEFAULT_ANALYTICS_CONFIG, ...c.analytics });
        this.invalidation = new InvalidationManager({ ...DEFAULT_INVALIDATION_CONFIG, ...c.invalidation });
        this.compressor = new CacheCompressor({ ...DEFAULT_COMPRESSION_CONFIG, ...c.compression });
        if (c.distributed?.enabled) {
            this.distributed = new DistributedCache({ ...DEFAULT_DISTRIBUTED_CONFIG, ...c.distributed }, this.compressor);
        }
    }
    /** Attach a warmer after construction (needs search function). */
    setWarmer(searchFn, config) {
        const merged = { ...DEFAULT_WARMER_CONFIG, ...config };
        this.warmer = new CacheWarmer(merged, this.analytics, searchFn);
    }
    /** Connect distributed cache. Call during bootstrap. */
    async connectDistributed() {
        if (this.distributed) {
            return this.distributed.connect();
        }
        return false;
    }
    /** Warm the cache. Call during bootstrap. */
    async warm() {
        if (this.warmer) {
            return this.warmer.warm();
        }
        return { warmed: 0, failed: 0, durationMs: 0 };
    }
    async get(query, engines) {
        const key = this.getKey(query, engines);
        const startTime = Date.now();
        // Distributed first
        if (this.distributed?.isHealthy()) {
            const distResult = await this.distributed.get(key);
            if (distResult) {
                this.analytics.recordHit(key, Date.now() - startTime);
                return distResult;
            }
        }
        // Local cache
        const entry = this.cache.get(key);
        if (entry) {
            const ttl = this.invalidation.computeTTL({
                query,
                engines: engines,
                accessCount: entry.accessCount,
                lastAccessGapMs: Date.now() - entry.lastAccessTime,
                baseTTLSeconds: this.ttl / 1000,
            });
            if (Date.now() - entry.timestamp <= ttl * 1000) {
                entry.accessCount++;
                entry.lastAccessSeq = ++this.accessSeq;
                entry.lastAccessTime = Date.now();
                this.analytics.recordHit(key, Date.now() - startTime);
                return this.compressor.decompress(entry.compressedData);
            }
            this.cache.delete(key);
            this.analytics.recordEviction(key);
        }
        this.analytics.recordMiss(key);
        return null;
    }
    set(query, engines, results) {
        const key = this.getKey(query, engines);
        const { data } = this.compressor.compress(results);
        if (this.cache.size >= this.maxSize) {
            this.evictLRU();
        }
        const now = Date.now();
        this.cache.set(key, {
            compressedData: data,
            timestamp: now,
            accessCount: 0,
            lastAccessSeq: ++this.accessSeq,
            lastAccessTime: now,
        });
        // Sync to distributed
        if (this.distributed?.isHealthy()) {
            const ttl = this.invalidation.computeTTL({
                query,
                engines: engines,
                accessCount: 0,
                lastAccessGapMs: 0,
                baseTTLSeconds: this.ttl / 1000,
            });
            this.distributed.set(key, results, ttl).catch(() => { });
        }
    }
    invalidate(query, engines) {
        const key = this.getKey(query, engines);
        return this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
    getMetrics() {
        const metrics = this.analytics.getSnapshot();
        let memoryBytes = 0;
        let compressedBytes = 0;
        for (const [_key, entry] of this.cache) {
            const pct = Buffer.byteLength(entry.compressedData, "utf-8");
            compressedBytes += pct;
            memoryBytes += pct + 40; // entry overhead estimate
        }
        return { ...metrics, memoryBytes, compressedBytes };
    }
    getStats() {
        const metrics = this.analytics.getSnapshot();
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            ttl: this.ttl / 1000,
            hitRate: metrics.hitRate,
        };
    }
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
    getAnalytics() {
        return this.analytics;
    }
    getDistributed() {
        return this.distributed;
    }
    async dispose() {
        if (this.distributed) {
            await this.distributed.disconnect();
        }
        this.cache.clear();
    }
    /**
     * Generate cache key from query and engines
     */
    getKey(query, engines) {
        return `${engines.slice().sort().join(",")}:${query}`;
    }
    evictLRU() {
        let oldestKey = null;
        let oldestSeq = Infinity;
        for (const [key, entry] of this.cache.entries()) {
            if (entry.lastAccessSeq < oldestSeq) {
                oldestSeq = entry.lastAccessSeq;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.analytics.recordEviction(oldestKey);
        }
    }
}
//# sourceMappingURL=search-cache.js.map