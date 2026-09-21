import { SearchStream } from "./stream.js";
import type { SearchOptions, SearchResult } from "../types/index.js";
import type { SearchSourceConfig, MetricsSnapshot, SearchSourceFn } from "./types.js";
export { SearchOptimizer, createSearchOptimizer } from "./optimizer.js";
export { SearchCoordinator, getCoordinator } from "./coordinator.js";
export { BatchQueue } from "./batch.js";
export { ConnectionPool } from "./pool.js";
export { SearchStream } from "./stream.js";
export { PerformanceMetrics } from "./metrics.js";
export type { SearchSourceConfig, SearchTask, SearchSourceResult, AggregatedResults, StreamEvent, BatchConfig, PoolConfig, PoolStats, LatencyRecord, MetricsSnapshot, CoordinatorConfig, SearchFn, } from "./types.js";
export declare function search(options: SearchOptions): Promise<SearchResult[]>;
/** Stream search results as they arrive. (v3.0.3) */
export declare function searchStream(options: SearchOptions): SearchStream;
/** Get search performance metrics. (v3.0.3) */
export declare function getSearchMetrics(): MetricsSnapshot;
/** Register a custom search source at runtime. (v3.0.3) */
export declare function registerSearchSource(source: SearchSourceConfig, fn: SearchSourceFn): void;
export { search as default };
//# sourceMappingURL=index.d.ts.map