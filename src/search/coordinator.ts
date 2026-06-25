import type { SearchResult } from "../types/index.js";
import { SearchOptimizer } from "./optimizer.js";
import { ConnectionPool } from "./pool.js";
import { PerformanceMetrics } from "./metrics.js";
import { SearchStream } from "./stream.js";
import { DEFAULT_COORDINATOR_CONFIG } from "./types.js";
import type {
  SearchSourceConfig, SearchTask, SearchSourceResult,
  AggregatedResults, CoordinatorConfig, MetricsSnapshot, PoolConfig,
} from "./types.js";

type SearchSourceFn = (query: string, maxResults: number, signal: AbortSignal) => Promise<SearchResult[]>;

export class SearchCoordinator {
  private sources = new Map<string, SearchSourceConfig>();
  private sourceFns = new Map<string, SearchSourceFn>();
  private pool: ConnectionPool;
  private metrics: PerformanceMetrics;
  private optimizer: SearchOptimizer;
  private config: CoordinatorConfig;

  constructor(
    sources: SearchSourceConfig[] = [],
    sourceFns?: Record<string, SearchSourceFn>,
    config?: CoordinatorConfig,
    poolConfig?: Partial<PoolConfig>,
  ) {
    this.config = { ...DEFAULT_COORDINATOR_CONFIG, ...config };
    this.pool = new ConnectionPool(poolConfig);
    this.metrics = new PerformanceMetrics();
    this.optimizer = new SearchOptimizer();
    for (const s of sources) {
      this.sources.set(s.id, s);
    }
    if (sourceFns) {
      for (const [id, fn] of Object.entries(sourceFns)) {
        this.sourceFns.set(id, fn);
      }
    }
  }

  async search(task: SearchTask): Promise<AggregatedResults> {
    const enabledSources = task.sources.filter((s) => s.enabled && this.sourceFns.has(s.id));
    const sorted = enabledSources.sort((a, b) => a.priority - b.priority);

    const controller = new AbortController();
    const timeoutMs = this.config.defaultTimeoutMs!;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const startTime = Date.now();
    const sourceResults: SearchSourceResult[] = [];
    let successCount = 0;
    let failCount = 0;

    // Execute with connection pool concurrency control
    const batchSize = this.config.maxConcurrency!;
    for (let i = 0; i < sorted.length; i += batchSize) {
      const batch = sorted.slice(i, i + batchSize);
      const batchPromises = batch.map(async (source): Promise<SearchSourceResult> => {
        const start = Date.now();
        try {
          const fn = this.sourceFns.get(source.id)!;
          const signal = task.options?.abortSignal ?? controller.signal;
          const results = await fn(task.query, task.options?.maxResults ?? 20, signal);
          const latencyMs = Date.now() - start;
          this.metrics.record(source.id, task.query, latencyMs, true);
          return { sourceId: source.id, results, latencyMs };
        } catch (e: any) {
          const latencyMs = Date.now() - start;
          this.metrics.record(source.id, task.query, latencyMs, false);
          return { sourceId: source.id, results: [], latencyMs, error: e?.message ?? String(e) };
        }
      });

      const results = await Promise.allSettled(batchPromises);
      for (const r of results) {
        if (r.status === "fulfilled") {
          sourceResults.push(r.value);
          if (!r.value.error) successCount++;
          else failCount++;
        } else {
          failCount++;
        }
      }
    }

    clearTimeout(timeout);

    // Aggregate results
    const allResults = sourceResults.flatMap((s) => s.results);
    const aggregated = this.optimizeResults(allResults, task.sources);

    return {
      results: aggregated,
      totalSources: enabledSources.length,
      successfulSources: successCount,
      failedSources: failCount,
      totalLatencyMs: Date.now() - startTime,
      perSource: sourceResults,
    };
  }

  searchStream(task: SearchTask): SearchStream {
    const enabledSources = task.sources.filter((s) => s.enabled && this.sourceFns.has(s.id));
    const stream = new SearchStream(enabledSources.length);

    // Execute async, don't await
    this.executeStreamSearch(task, enabledSources, stream).catch(() => {});

    return stream;
  }

  private async executeStreamSearch(
    task: SearchTask,
    sources: SearchSourceConfig[],
    stream: SearchStream,
  ): Promise<void> {
    const controller = new AbortController();
    const sorted = sources.sort((a, b) => a.priority - b.priority);

    const promises = sorted.map(async (source) => {
      const start = Date.now();
      try {
        const fn = this.sourceFns.get(source.id)!;
        const signal = task.options?.abortSignal ?? controller.signal;
        const maxResults = task.options?.maxResults ?? 20;
        const results = await fn(task.query, maxResults, signal);

        for (const r of results) {
          if (stream.isCancelled) break;
          stream.emit({ type: "result", data: r, sourceId: source.id });
        }

        stream.emit({ type: "source_complete", sourceId: source.id });
        this.metrics.record(source.id, task.query, Date.now() - start, true);
        return results;
      } catch (e: any) {
        stream.emit({ type: "error", error: e, sourceId: source.id });
        this.metrics.record(source.id, task.query, Date.now() - start, false);
        return [] as SearchResult[];
      }
    });

    await Promise.allSettled(promises);
    stream.emit({ type: "complete" });
  }

  cancel(queryKey: string): void {
    // Cancel logic keyed by query
  }

  registerSource(config: SearchSourceConfig, fn?: SearchSourceFn): void {
    this.sources.set(config.id, config);
    if (fn) this.sourceFns.set(config.id, fn);
  }

  getSources(): SearchSourceConfig[] {
    return [...this.sources.values()];
  }

  getMetrics(): MetricsSnapshot {
    return this.metrics.getSnapshot();
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return this.metrics;
  }

  getConnectionPool(): ConnectionPool {
    return this.pool;
  }

  async dispose(): Promise<void> {
    await this.pool.close();
  }

  private optimizeResults(results: SearchResult[], sources: SearchSourceConfig[]): SearchResult[] {
    const weightMap = new Map(sources.map((s) => [s.id, s.weight]));
    const deduped = SearchOptimizer.deduplicateResults(results);
    return deduped.sort((a, b) => {
      const wA = weightMap.get(a.source) ?? 1.0;
      const wB = weightMap.get(b.source) ?? 1.0;
      return wB - wA;
    });
  }
}

// Singleton
let coordinator: SearchCoordinator | null = null;

export function getCoordinator(sources?: SearchSourceConfig[], sourceFns?: Record<string, SearchSourceFn>): SearchCoordinator {
  if (!coordinator) {
    coordinator = new SearchCoordinator(sources, sourceFns);
  } else if (sources && sourceFns) {
    for (const s of sources) {
      coordinator.registerSource(s, sourceFns[s.id]);
    }
  }
  return coordinator;
}

export { SearchCoordinator as default };
