import type { SearchResult, SearchEngine } from "../types/index.js";
import { DEFAULT_WARMER_CONFIG } from "./types.js";
import type { WarmerConfig } from "./types.js";
import type { CacheAnalytics } from "./analytics.js";

export type SearchFn = (query: string, engines: SearchEngine[]) => Promise<SearchResult[]>;

export class CacheWarmer {
  private extraQueries: string[] = [];

  constructor(
    private config: WarmerConfig = { ...DEFAULT_WARMER_CONFIG },
    private analytics: CacheAnalytics,
    private searchFn: SearchFn,
  ) {}

  async warm(): Promise<{ warmed: number; failed: number; durationMs: number }> {
    if (!this.config.enabled) {
      return { warmed: 0, failed: 0, durationMs: 0 };
    }

    const startTime = Date.now();
    const queries = this.collectQueries();

    if (queries.length === 0) {
      return { warmed: 0, failed: 0, durationMs: Date.now() - startTime };
    }

    let warmed = 0;
    let failed = 0;

    // Run with concurrency limit
    for (let i = 0; i < queries.length; i += this.config.concurrency) {
      const batch = queries.slice(i, i + this.config.concurrency);
      const results = await Promise.allSettled(
        batch.map((q) => this.warmOne(q)),
      );

      for (const r of results) {
        if (r.status === "fulfilled") warmed++;
        else failed++;
      }
    }

    return { warmed, failed, durationMs: Date.now() - startTime };
  }

  addQuery(query: string): void {
    this.extraQueries.push(query);
  }

  private collectQueries(): string[] {
    const queries = new Set(this.config.queries);

    if (this.config.topKFromAnalytics) {
      for (const key of this.analytics.getTopKeys().slice(0, this.config.topKLimit)) {
        const query = this.extractQueryFromKey(key);
        if (query) queries.add(query);
      }
    }

    for (const q of this.extraQueries) {
      queries.add(q);
    }

    return [...queries];
  }

  private async warmOne(query: string): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      await this.searchFn(query, this.config.engines);
    } finally {
      clearTimeout(timeout);
    }
  }

  private extractQueryFromKey(key: string): string {
    const idx = key.indexOf(":");
    return idx > 0 ? key.slice(idx + 1) : key;
  }
}
