/**
 * Licensed under the Apache License, Version 2.0
 * DeepClaw v3.9.0 — Metrics Collector (claw-obs integration)
 */
import { EventBus, TokenCounter } from "claw-obs";
export class MetricsCollector {
    eventBus = null;
    tokenCounter;
    metrics;
    sessionId;
    constructor(config) {
        this.sessionId = config?.sessionId ?? `deepclaw-${Date.now()}`;
        if (config?.enableEvents) {
            this.eventBus = new EventBus();
        }
        this.tokenCounter = new TokenCounter();
        this.metrics = this.initMetrics();
    }
    recordSearchLatency(source, latencyMs) {
        const latencies = this.metrics.searchLatency.get(source) ?? [];
        latencies.push(latencyMs);
        this.metrics.searchLatency.set(source, latencies);
        this.metrics.searchCount++;
        this.eventBus?.emit("search_complete", { source, latencyMs });
    }
    recordExtractionQuality(docId, score) {
        this.metrics.extractionQuality.set(docId, score);
        this.eventBus?.emit("extraction_complete", { docId, score });
    }
    recordGateResult(gateName, passed) {
        const result = this.metrics.gateResults.get(gateName) ?? {
            gateName,
            passed: 0,
            failed: 0,
            lastCheck: new Date().toISOString(),
        };
        if (passed)
            result.passed++;
        else
            result.failed++;
        result.lastCheck = new Date().toISOString();
        this.metrics.gateResults.set(gateName, result);
        this.eventBus?.emit("gate_check", { gateName, passed });
    }
    recordTokenUsage(stage, count, model) {
        this.tokenCounter.record(count, 0);
        this.metrics.tokenUsage.total += count;
        const stageUsage = this.metrics.tokenUsage.byStage.get(stage) ?? 0;
        this.metrics.tokenUsage.byStage.set(stage, stageUsage + count);
        if (model) {
            const modelUsage = this.metrics.tokenUsage.byModel.get(model) ?? 0;
            this.metrics.tokenUsage.byModel.set(model, modelUsage + count);
        }
    }
    updateMemoryUsage(current, contextSize) {
        this.metrics.memoryUsage.current = current;
        this.metrics.memoryUsage.contextSize = contextSize;
        if (current > this.metrics.memoryUsage.peak) {
            this.metrics.memoryUsage.peak = current;
        }
    }
    getMetrics() {
        return { ...this.metrics };
    }
    getSnapshot() {
        return {
            timestamp: new Date().toISOString(),
            metrics: this.getMetrics(),
            sessionId: this.sessionId,
        };
    }
    async flush() {
        this.eventBus?.emit("metrics_flush", this.getSnapshot());
    }
    getTokenTotals() {
        return this.tokenCounter.totals;
    }
    reset() {
        this.metrics = this.initMetrics();
        this.tokenCounter.reset();
    }
    initMetrics() {
        return {
            searchLatency: new Map(),
            searchCount: 0,
            extractionQuality: new Map(),
            gateResults: new Map(),
            tokenUsage: { total: 0, byStage: new Map(), byModel: new Map() },
            memoryUsage: { peak: 0, current: 0, contextSize: 0 },
        };
    }
}
export const metricsCollector = new MetricsCollector();
//# sourceMappingURL=MetricsCollector.js.map