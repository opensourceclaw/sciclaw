/**
 * SciClaw v3.6.0 — Metrics Collector (OBSERVE Stage)
 * Collects and tracks operational metrics for research workflow
 */
/**
 * Metric types
 */
export type MetricType = "counter" | "gauge" | "histogram" | "timing";
/**
 * Single metric record
 */
export interface MetricRecord {
    name: string;
    type: MetricType;
    value: number;
    timestamp: number;
    tags?: Record<string, string>;
}
/**
 * Metric aggregation result
 */
export interface MetricSummary {
    name: string;
    count: number;
    sum: number;
    min: number;
    max: number;
    avg: number;
    lastValue: number;
    lastTimestamp: number;
}
/**
 * MetricsCollector - Collects operational metrics
 */
export declare class MetricsCollector {
    private metrics;
    private counters;
    private gauges;
    private maxRecords;
    constructor(maxRecords?: number);
    /**
     * Increment a counter
     */
    incrementCounter(name: string, delta?: number, tags?: Record<string, string>): void;
    /**
     * Set a gauge value
     */
    setGauge(name: string, value: number, tags?: Record<string, string>): void;
    /**
     * Record a timing measurement
     */
    recordTiming(name: string, durationMs: number, tags?: Record<string, string>): void;
    /**
     * Time an async operation
     */
    timeOperation<T>(name: string, operation: () => Promise<T>): Promise<T>;
    /**
     * Record a raw metric
     */
    private recordMetric;
    /**
     * Get counter value
     */
    getCounter(name: string): number;
    /**
     * Get gauge value
     */
    getGauge(name: string): number | undefined;
    /**
     * Get metric summary
     */
    getSummary(name: string): MetricSummary | null;
    /**
     * Get all metric names
     */
    getMetricNames(): string[];
    /**
     * Get all counters
     */
    getAllCounters(): Record<string, number>;
    /**
     * Get all gauges
     */
    getAllGauges(): Record<string, number>;
    /**
     * Export metrics for reporting
     */
    export(): {
        counters: Record<string, number>;
        gauges: Record<string, number>;
        summaries: Record<string, MetricSummary | null>;
    };
    /**
     * Reset all metrics
     */
    reset(): void;
}
export declare const metricsCollector: MetricsCollector;
/**
 * Pre-defined research metrics
 */
export declare const ResearchMetrics: {
    readonly SEARCH_REQUESTS: "research.search.requests";
    readonly SEARCH_LATENCY: "research.search.latency_ms";
    readonly SOURCES_FOUND: "research.sources.found";
    readonly ANALYSIS_TIME: "research.analysis.time_ms";
    readonly FINDINGS_COUNT: "research.findings.count";
    readonly REPORT_SIZE: "research.report.size_bytes";
};
//# sourceMappingURL=metrics-collector.d.ts.map