/**
 * Licensed under the Apache License, Version 2.0
 * SciClaw v3.9.0 — Metrics Collector (claw-obs integration)
 */

import { EventBus, TokenCounter } from "claw-obs";
import type { ResearchMetrics, MetricsSnapshot, GateResult } from "./ResearchMetrics.js";

export interface MetricsCollectorConfig {
  enableEvents?: boolean;
  sessionId?: string;
}

export class MetricsCollector {
  private eventBus: EventBus | null = null;
  private tokenCounter: TokenCounter;
  private metrics: ResearchMetrics;
  private sessionId: string;

  constructor(config?: MetricsCollectorConfig) {
    this.sessionId = config?.sessionId ?? `deepclaw-${Date.now()}`;
    if (config?.enableEvents) {
      this.eventBus = new EventBus();
    }
    this.tokenCounter = new TokenCounter();
    this.metrics = this.initMetrics();
  }

  recordSearchLatency(source: string, latencyMs: number): void {
    const latencies = this.metrics.searchLatency.get(source) ?? [];
    latencies.push(latencyMs);
    this.metrics.searchLatency.set(source, latencies);
    this.metrics.searchCount++;
    this.eventBus?.emit("search_complete", { source, latencyMs });
  }

  recordExtractionQuality(docId: string, score: number): void {
    this.metrics.extractionQuality.set(docId, score);
    this.eventBus?.emit("extraction_complete", { docId, score });
  }

  recordGateResult(gateName: string, passed: boolean): void {
    const result = this.metrics.gateResults.get(gateName) ?? {
      gateName,
      passed: 0,
      failed: 0,
      lastCheck: new Date().toISOString(),
    };
    if (passed) result.passed++;
    else result.failed++;
    result.lastCheck = new Date().toISOString();
    this.metrics.gateResults.set(gateName, result);
    this.eventBus?.emit("gate_check", { gateName, passed });
  }

  recordTokenUsage(stage: string, count: number, model?: string): void {
    this.tokenCounter.record(count, 0);
    this.metrics.tokenUsage.total += count;
    const stageUsage = this.metrics.tokenUsage.byStage.get(stage) ?? 0;
    this.metrics.tokenUsage.byStage.set(stage, stageUsage + count);
    if (model) {
      const modelUsage = this.metrics.tokenUsage.byModel.get(model) ?? 0;
      this.metrics.tokenUsage.byModel.set(model, modelUsage + count);
    }
  }

  updateMemoryUsage(current: number, contextSize: number): void {
    this.metrics.memoryUsage.current = current;
    this.metrics.memoryUsage.contextSize = contextSize;
    if (current > this.metrics.memoryUsage.peak) {
      this.metrics.memoryUsage.peak = current;
    }
  }

  getMetrics(): ResearchMetrics {
    return { ...this.metrics };
  }

  getSnapshot(): MetricsSnapshot {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      sessionId: this.sessionId,
    };
  }

  async flush(): Promise<void> {
    this.eventBus?.emit("metrics_flush", this.getSnapshot());
  }

  getTokenTotals(): { prompt: number; completion: number; total: number; calls: number } {
    return this.tokenCounter.totals;
  }

  reset(): void {
    this.metrics = this.initMetrics();
    this.tokenCounter.reset();
  }

  private initMetrics(): ResearchMetrics {
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
