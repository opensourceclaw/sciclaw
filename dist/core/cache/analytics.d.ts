import type { CacheAnalyticsConfig, CacheMetrics } from "./types.js";
export declare class CacheAnalytics {
    private config;
    private hits;
    private misses;
    private totalLatencySavedMs;
    private evictions;
    private keyHits;
    private periodStart;
    constructor(config?: CacheAnalyticsConfig);
    recordHit(key: string, latencyMs: number): void;
    recordMiss(key: string): void;
    recordEviction(key: string): void;
    getSnapshot(): CacheMetrics;
    reset(): void;
    flush(): Promise<void>;
    getTopKeys(): string[];
    private truncateKey;
}
//# sourceMappingURL=analytics.d.ts.map