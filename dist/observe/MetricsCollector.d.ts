/**
 * Licensed under the Apache License, Version 2.0
 * SciClaw v4.0.0 — Metrics Collector (self-contained; claw-obs port).
 *
 * claw-obs v2.5.0 removed the generic `EventBus` / `TokenCounter` utilities this
 * module used: its v2.5 face is `MetricsAggregator` (windowed min/max/avg
 * aggregation) + `AlertEngine` (rule-based alerting) — neither covers pub/sub
 * consumer events or cumulative usage counters. Ported to internal lightweight
 * equivalents, self-contained, zero new dependencies (ruling basis:
 * ack-clawobs-port-metricscollector-20260921).
 */
import type { ResearchMetrics, MetricsSnapshot } from "./ResearchMetrics.js";
export interface MetricsCollectorConfig {
    enableEvents?: boolean;
    sessionId?: string;
}
export declare class MetricsCollector {
    private eventBus;
    private tokenCounter;
    private metrics;
    private sessionId;
    constructor(config?: MetricsCollectorConfig);
    recordSearchLatency(source: string, latencyMs: number): void;
    recordExtractionQuality(docId: string, score: number): void;
    recordGateResult(gateName: string, passed: boolean): void;
    recordTokenUsage(stage: string, count: number, model?: string): void;
    updateMemoryUsage(current: number, contextSize: number): void;
    getMetrics(): ResearchMetrics;
    getSnapshot(): MetricsSnapshot;
    flush(): Promise<void>;
    getTokenTotals(): {
        prompt: number;
        completion: number;
        total: number;
        calls: number;
    };
    reset(): void;
    private initMetrics;
}
export declare const metricsCollector: MetricsCollector;
//# sourceMappingURL=MetricsCollector.d.ts.map