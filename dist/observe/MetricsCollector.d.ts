/**
 * Licensed under the Apache License, Version 2.0
 * DeepClaw v3.9.0 — Metrics Collector (claw-obs integration)
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