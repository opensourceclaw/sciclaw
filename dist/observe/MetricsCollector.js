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
/** Minimal internal event emitter — replaces claw-obs's removed `EventBus`. */
class MetricsEventBus {
    handlers = new Map();
    on(event, handler) {
        const list = this.handlers.get(event) ?? [];
        list.push(handler);
        this.handlers.set(event, list);
    }
    emit(event, payload) {
        for (const handler of this.handlers.get(event) ?? []) {
            handler(payload);
        }
    }
}
/** Minimal cumulative token counter — replaces claw-obs's removed `TokenCounter`. */
class TokenUsageCounter {
    promptTokens = 0;
    completionTokens = 0;
    callCount = 0;
    record(promptTokens, completionTokens) {
        this.promptTokens += promptTokens;
        this.completionTokens += completionTokens;
        this.callCount++;
    }
    get totals() {
        return {
            prompt: this.promptTokens,
            completion: this.completionTokens,
            total: this.promptTokens + this.completionTokens,
            calls: this.callCount,
        };
    }
    reset() {
        this.promptTokens = 0;
        this.completionTokens = 0;
        this.callCount = 0;
    }
}
export class MetricsCollector {
    eventBus = null;
    tokenCounter;
    metrics;
    sessionId;
    constructor(config) {
        this.sessionId = config?.sessionId ?? `deepclaw-${Date.now()}`;
        if (config?.enableEvents) {
            this.eventBus = new MetricsEventBus();
        }
        this.tokenCounter = new TokenUsageCounter();
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