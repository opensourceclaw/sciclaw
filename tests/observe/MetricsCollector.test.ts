import { describe, it, expect, beforeEach } from "vitest";
import { MetricsCollector, metricsCollector } from "../../src/observe/MetricsCollector.js";

describe("MetricsCollector", () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector();
  });

  it("should create with default config", () => {
    expect(collector).toBeDefined();
  });

  it("should create with events enabled", () => {
    const c = new MetricsCollector({ enableEvents: true });
    expect(c).toBeDefined();
  });

  it("should create with custom session ID", () => {
    const c = new MetricsCollector({ sessionId: "test-session-123" });
    const snapshot = c.getSnapshot();
    expect(snapshot.sessionId).toBe("test-session-123");
  });

  it("should record search latency", () => {
    collector.recordSearchLatency("web", 150);
    collector.recordSearchLatency("web", 200);
    collector.recordSearchLatency("scholar", 300);

    const metrics = collector.getMetrics();
    expect(metrics.searchCount).toBe(3);
    expect(metrics.searchLatency.get("web")).toEqual([150, 200]);
    expect(metrics.searchLatency.get("scholar")).toEqual([300]);
  });

  it("should record extraction quality", () => {
    collector.recordExtractionQuality("doc-1", 0.95);
    collector.recordExtractionQuality("doc-2", 0.80);

    const metrics = collector.getMetrics();
    expect(metrics.extractionQuality.get("doc-1")).toBe(0.95);
    expect(metrics.extractionQuality.get("doc-2")).toBe(0.80);
  });

  it("should record gate results", () => {
    collector.recordGateResult("design-review", true);
    collector.recordGateResult("design-review", false);
    collector.recordGateResult("code-review", true);

    const metrics = collector.getMetrics();
    const designGate = metrics.gateResults.get("design-review")!;
    expect(designGate.passed).toBe(1);
    expect(designGate.failed).toBe(1);

    const codeGate = metrics.gateResults.get("code-review")!;
    expect(codeGate.passed).toBe(1);
    expect(codeGate.failed).toBe(0);
  });

  it("should record token usage", () => {
    collector.recordTokenUsage("search", 5000, "deepseek-v3");
    collector.recordTokenUsage("search", 3000, "deepseek-v3");
    collector.recordTokenUsage("synthesize", 8000, "claude-opus-4");

    const totals = collector.getTokenTotals();
    expect(totals.prompt).toBe(16000);
    expect(totals.calls).toBe(3);

    const metrics = collector.getMetrics();
    expect(metrics.tokenUsage.total).toBe(16000);
    expect(metrics.tokenUsage.byStage.get("search")).toBe(8000);
    expect(metrics.tokenUsage.byStage.get("synthesize")).toBe(8000);
    expect(metrics.tokenUsage.byModel.get("deepseek-v3")).toBe(8000);
    expect(metrics.tokenUsage.byModel.get("claude-opus-4")).toBe(8000);
  });

  it("should update memory usage and track peak", () => {
    collector.updateMemoryUsage(1000, 500);
    collector.updateMemoryUsage(2000, 500);
    collector.updateMemoryUsage(1500, 500);

    const metrics = collector.getMetrics();
    expect(metrics.memoryUsage.peak).toBe(2000);
    expect(metrics.memoryUsage.current).toBe(1500);
    expect(metrics.memoryUsage.contextSize).toBe(500);
  });

  it("should get snapshot", () => {
    collector.recordSearchLatency("web", 100);
    const snapshot = collector.getSnapshot();

    expect(snapshot.timestamp).toBeDefined();
    expect(snapshot.sessionId).toBeDefined();
    expect(snapshot.metrics).toBeDefined();
    expect(snapshot.metrics.searchCount).toBe(1);
  });

  it("should flush metrics without error", async () => {
    collector.recordSearchLatency("web", 100);
    await expect(collector.flush()).resolves.toBeUndefined();
  });

  it("should reset metrics", () => {
    collector.recordSearchLatency("web", 100);
    collector.recordTokenUsage("search", 5000);
    expect(collector.getMetrics().searchCount).toBe(1);

    collector.reset();
    expect(collector.getMetrics().searchCount).toBe(0);
    expect(collector.getMetrics().tokenUsage.total).toBe(0);
    expect(collector.getTokenTotals().total).toBe(0);
  });

  it("should use singleton metricsCollector", () => {
    expect(metricsCollector).toBeDefined();
    const snapshot = metricsCollector.getSnapshot();
    expect(snapshot.sessionId).toBeDefined();
  });
});
