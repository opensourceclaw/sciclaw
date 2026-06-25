import { SearchOptimizer } from "./optimizer.js";
import { ConnectionPool } from "./pool.js";
import { PerformanceMetrics } from "./metrics.js";
import { SearchStream } from "./stream.js";
import { DEFAULT_COORDINATOR_CONFIG } from "./types.js";
export class SearchCoordinator {
    sources = new Map();
    sourceFns = new Map();
    pool;
    metrics;
    optimizer;
    config;
    constructor(sources = [], sourceFns, config, poolConfig) {
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
    async search(task) {
        const enabledSources = task.sources.filter((s) => s.enabled && this.sourceFns.has(s.id));
        const sorted = enabledSources.sort((a, b) => a.priority - b.priority);
        const controller = new AbortController();
        const timeoutMs = this.config.defaultTimeoutMs;
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        const startTime = Date.now();
        const sourceResults = [];
        let successCount = 0;
        let failCount = 0;
        // Execute with connection pool concurrency control
        const batchSize = this.config.maxConcurrency;
        for (let i = 0; i < sorted.length; i += batchSize) {
            const batch = sorted.slice(i, i + batchSize);
            const batchPromises = batch.map(async (source) => {
                const start = Date.now();
                try {
                    const fn = this.sourceFns.get(source.id);
                    const signal = task.options?.abortSignal ?? controller.signal;
                    const results = await fn(task.query, task.options?.maxResults ?? 20, signal);
                    const latencyMs = Date.now() - start;
                    this.metrics.record(source.id, task.query, latencyMs, true);
                    return { sourceId: source.id, results, latencyMs };
                }
                catch (e) {
                    const latencyMs = Date.now() - start;
                    this.metrics.record(source.id, task.query, latencyMs, false);
                    return { sourceId: source.id, results: [], latencyMs, error: e?.message ?? String(e) };
                }
            });
            const results = await Promise.allSettled(batchPromises);
            for (const r of results) {
                if (r.status === "fulfilled") {
                    sourceResults.push(r.value);
                    if (!r.value.error)
                        successCount++;
                    else
                        failCount++;
                }
                else {
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
    searchStream(task) {
        const enabledSources = task.sources.filter((s) => s.enabled && this.sourceFns.has(s.id));
        const stream = new SearchStream(enabledSources.length);
        // Execute async, don't await
        this.executeStreamSearch(task, enabledSources, stream).catch(() => { });
        return stream;
    }
    async executeStreamSearch(task, sources, stream) {
        const controller = new AbortController();
        const sorted = sources.sort((a, b) => a.priority - b.priority);
        const promises = sorted.map(async (source) => {
            const start = Date.now();
            try {
                const fn = this.sourceFns.get(source.id);
                const signal = task.options?.abortSignal ?? controller.signal;
                const maxResults = task.options?.maxResults ?? 20;
                const results = await fn(task.query, maxResults, signal);
                for (const r of results) {
                    if (stream.isCancelled)
                        break;
                    stream.emit({ type: "result", data: r, sourceId: source.id });
                }
                stream.emit({ type: "source_complete", sourceId: source.id });
                this.metrics.record(source.id, task.query, Date.now() - start, true);
                return results;
            }
            catch (e) {
                stream.emit({ type: "error", error: e, sourceId: source.id });
                this.metrics.record(source.id, task.query, Date.now() - start, false);
                return [];
            }
        });
        await Promise.allSettled(promises);
        stream.emit({ type: "complete" });
    }
    cancel(queryKey) {
        // Cancel logic keyed by query
    }
    registerSource(config, fn) {
        this.sources.set(config.id, config);
        if (fn)
            this.sourceFns.set(config.id, fn);
    }
    getSources() {
        return [...this.sources.values()];
    }
    getMetrics() {
        return this.metrics.getSnapshot();
    }
    getPerformanceMetrics() {
        return this.metrics;
    }
    getConnectionPool() {
        return this.pool;
    }
    async dispose() {
        await this.pool.close();
    }
    optimizeResults(results, sources) {
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
let coordinator = null;
export function getCoordinator(sources, sourceFns) {
    if (!coordinator) {
        coordinator = new SearchCoordinator(sources, sourceFns);
    }
    else if (sources && sourceFns) {
        for (const s of sources) {
            coordinator.registerSource(s, sourceFns[s.id]);
        }
    }
    return coordinator;
}
export { SearchCoordinator as default };
//# sourceMappingURL=coordinator.js.map