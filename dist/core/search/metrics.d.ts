import type { LatencyRecord, MetricsSnapshot } from "./types.js";
export declare class PerformanceMetrics {
    private records;
    private windowMs;
    constructor(windowMs?: number);
    record(sourceId: string, query: string, latencyMs: number, success: boolean): void;
    getSnapshot(): MetricsSnapshot;
    getSourceStats(sourceId: string): {
        p95: number;
        avg: number;
        successRate: number;
    } | null;
    prune(): void;
    reset(): void;
    getRecords(): ReadonlyArray<LatencyRecord>;
    private getWindowRecords;
}
//# sourceMappingURL=metrics.d.ts.map