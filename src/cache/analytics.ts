import { DEFAULT_ANALYTICS_CONFIG } from "./types.js";
import type { CacheAnalyticsConfig, CacheMetrics } from "./types.js";

export class CacheAnalytics {
  private hits = 0;
  private misses = 0;
  private totalLatencySavedMs = 0;
  private evictions = 0;
  private keyHits = new Map<string, number>();
  private periodStart = Date.now();

  constructor(private config: CacheAnalyticsConfig = { ...DEFAULT_ANALYTICS_CONFIG }) {}

  recordHit(key: string, latencyMs: number): void {
    if (!this.config.enabled) return;
    this.hits++;
    this.totalLatencySavedMs += latencyMs;
    const shortKey = this.truncateKey(key);
    const count = (this.keyHits.get(shortKey) ?? 0) + 1;
    if (this.keyHits.size < this.config.maxKeysInMemory || this.keyHits.has(shortKey)) {
      this.keyHits.set(shortKey, count);
    }
  }

  recordMiss(key: string): void {
    if (!this.config.enabled) return;
    this.misses++;
  }

  recordEviction(key: string): void {
    if (!this.config.enabled) return;
    this.evictions++;
  }

  getSnapshot(): CacheMetrics {
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

  reset(): void {
    this.hits = 0;
    this.misses = 0;
    this.totalLatencySavedMs = 0;
    this.evictions = 0;
    this.keyHits.clear();
    this.periodStart = Date.now();
  }

  async flush(): Promise<void> {
    // Persist to claw-mem if available, otherwise no-op
  }

  getTopKeys(): string[] {
    return [...this.keyHits.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.config.topKLimit)
      .map(([key]) => key);
  }

  private truncateKey(key: string): string {
    return key.length > 200 ? key.slice(0, 200) : key;
  }
}
