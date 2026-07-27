/**
 * DeepClaw v3.9.0 — Observe Module
 * Operational observation and monitoring for research workflow
 */

// v3.6.0 existing exports
export { MetricsCollector, metricsCollector, ResearchMetrics } from "./metrics-collector.js";
export type { MetricRecord, MetricSummary, MetricType } from "./metrics-collector.js";

// v3.9.0 new exports (claw-obs integration)
export { MetricsCollector as ResearchMetricsCollector, metricsCollector as researchMetricsCollector } from "./MetricsCollector.js";
export type { MetricsCollectorConfig } from "./MetricsCollector.js";
export type { ResearchMetrics as DetailedResearchMetrics } from "./ResearchMetrics.js";
export type { GateResult, TokenUsage, MemoryUsage, MetricsSnapshot } from "./ResearchMetrics.js";
