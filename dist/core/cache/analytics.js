import { DEFAULT_ANALYTICS_CONFIG } from "./types.js";
export class CacheAnalytics {
    config;
    hits = 0;
    misses = 0;
    totalLatencySavedMs = 0;
    evictions = 0;
    keyHits = new Map();
    periodStart = Date.now();
    constructor(config = { ...DEFAULT_ANALYTICS_CONFIG }) {
        this.config = config;
    }
    recordHit(key, latencyMs) {
        if (!this.config.enabled)
            return;
        this.hits++;
        this.totalLatencySavedMs += latencyMs;
        const shortKey = this.truncateKey(key);
        const count = (this.keyHits.get(shortKey) ?? 0) + 1;
        if (this.keyHits.size < this.config.maxKeysInMemory || this.keyHits.has(shortKey)) {
            this.keyHits.set(shortKey, count);
        }
    }
    recordMiss(key) {
        if (!this.config.enabled)
            return;
        this.misses++;
    }
    recordEviction(key) {
        if (!this.config.enabled)
            return;
        this.evictions++;
    }
    getSnapshot() {
        const total = this.hits + this.misses;
        const topKeys = [...this.keyHits.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, this.config.topKLimit)
            .map(([key, hits]) => ({ key, hits }));
        return {
            hits: this.hits,
            misses: this.misses,
            hitRate: total > 0 ? this.hits / total : 0,
            avgLatencySavedMs: this.hits > 0 ? this.totalLatencySavedMs / this.hits : 0,
            totalRequests: total,
            evictions: this.evictions,
            memoryBytes: 0,
            compressedBytes: 0,
            topKeys,
            periodStart: this.periodStart,
        };
    }
    reset() {
        this.hits = 0;
        this.misses = 0;
        this.totalLatencySavedMs = 0;
        this.evictions = 0;
        this.keyHits.clear();
        this.periodStart = Date.now();
    }
    async flush() {
        // Persist to claw-mem if available, otherwise no-op
    }
    getTopKeys() {
        return [...this.keyHits.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, this.config.topKLimit)
            .map(([key]) => key);
    }
    truncateKey(key) {
        return key.length > 200 ? key.slice(0, 200) : key;
    }
}
//# sourceMappingURL=analytics.js.map