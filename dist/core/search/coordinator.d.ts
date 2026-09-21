import type { SearchResult } from "../types/index.js";
import { ConnectionPool } from "./pool.js";
import { PerformanceMetrics } from "./metrics.js";
import { SearchStream } from "./stream.js";
import type { SearchSourceConfig, SearchTask, AggregatedResults, CoordinatorConfig, MetricsSnapshot, PoolConfig } from "./types.js";
type SearchSourceFn = (query: string, maxResults: number, signal: AbortSignal) => Promise<SearchResult[]>;
export declare class SearchCoordinator {
    private sources;
    private sourceFns;
    private pool;
    private metrics;
    private optimizer;
    private config;
    constructor(sources?: SearchSourceConfig[], sourceFns?: Record<string, SearchSourceFn>, config?: CoordinatorConfig, poolConfig?: Partial<PoolConfig>);
    search(task: SearchTask): Promise<AggregatedResults>;
    searchStream(task: SearchTask): SearchStream;
    private executeStreamSearch;
    cancel(queryKey: string): void;
    registerSource(config: SearchSourceConfig, fn?: SearchSourceFn): void;
    getSources(): SearchSourceConfig[];
    getMetrics(): MetricsSnapshot;
    getPerformanceMetrics(): PerformanceMetrics;
    getConnectionPool(): ConnectionPool;
    dispose(): Promise<void>;
    private optimizeResults;
}
export declare function getCoordinator(sources?: SearchSourceConfig[], sourceFns?: Record<string, SearchSourceFn>): SearchCoordinator;
export { SearchCoordinator as default };
//# sourceMappingURL=coordinator.d.ts.map