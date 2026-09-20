/**
 * Licensed under the Apache License, Version 2.0
 * SciClaw v3.9.0 — Research Metrics Types
 */
export interface GateResult {
    gateName: string;
    passed: number;
    failed: number;
    lastCheck: string;
}
export interface TokenUsage {
    total: number;
    byStage: Map<string, number>;
    byModel: Map<string, number>;
}
export interface MemoryUsage {
    peak: number;
    current: number;
    contextSize: number;
}
export interface ResearchMetrics {
    searchLatency: Map<string, number[]>;
    searchCount: number;
    extractionQuality: Map<string, number>;
    gateResults: Map<string, GateResult>;
    tokenUsage: TokenUsage;
    memoryUsage: MemoryUsage;
}
export interface MetricsSnapshot {
    timestamp: string;
    metrics: ResearchMetrics;
    sessionId: string;
}
//# sourceMappingURL=ResearchMetrics.d.ts.map