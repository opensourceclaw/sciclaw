import { describe, it, expect, beforeEach } from "vitest";
import { PerformanceMetrics } from "../../src/search/metrics.js";

describe("PerformanceMetrics", () => {
  let metrics: PerformanceMetrics;

  beforeEach(() => {
    metrics = new PerformanceMetrics(60_000);
  });

  it("returns zero for empty metrics", () => {
    const snap = metrics.getSnapshot();
    expect(snap.p50).toBe(0);
    expect(snap.p95).toBe(0);
    expect(snap.p99).toBe(0);
    expect(snap.avg).toBe(0);
    expect(snap.totalRequests).toBe(0);
    expect(snap.successRate).toBe(0);
  });

  it("records and calculates percentiles", () => {
    for (let i = 1; i <= 100; i++) {
      metrics.record("s1", "q", i * 10, true);
    }
    const snap = metrics.getSnapshot();
    expect(snap.p50).toBeGreaterThan(400);
    expect(snap.p50).toBeLessThan(600);
    expect(snap.p95).toBeGreaterThan(900);
    expect(snap.totalRequests).toBe(100);
    expect(snap.successRate).toBe(1);
  });

  it("calculates per-source breakdown", () => {
    metrics.record("ddg", "q", 100, true);
    metrics.record("ddg", "q", 200, true);
    metrics.record("goog", "q", 500, true);
    metrics.record("goog", "q", 300, false);

    const snap = metrics.getSnapshot();
    expect(snap.perSource["ddg"]).toBeDefined();
    expect(snap.perSource["ddg"]!.successRate).toBe(1);
    expect(snap.perSource["goog"]!.successRate).toBe(0.5);
  });

  it("getSourceStats returns null for unknown source", () => {
    expect(metrics.getSourceStats("unknown")).toBeNull();
  });

  it("getSourceStats returns stats for known source", () => {
    metrics.record("ddg", "q", 100, true);
    const stats = metrics.getSourceStats("ddg");
    expect(stats).not.toBeNull();
    expect(stats!.avg).toBe(100);
  });

  it("reset clears all records", () => {
    metrics.record("s", "q", 100, true);
    metrics.reset();
    expect(metrics.getSnapshot().totalRequests).toBe(0);
  });

  it("getRecords returns raw records", () => {
    metrics.record("s", "q", 100, true);
    expect(metrics.getRecords()).toHaveLength(1);
  });

  it("prune removes old records", async () => {
    const short = new PerformanceMetrics(50);
    short.record("s", "q", 100, true);
    await new Promise((r) => setTimeout(r, 100));
    short.prune();
    expect(short.getSnapshot().totalRequests).toBe(0);
  });

  it("throughput calculates correctly", () => {
    for (let i = 0; i < 60; i++) {
      metrics.record("s", "q", i, true);
    }
    const snap = metrics.getSnapshot();
    expect(snap.throughput).toBe(1); // 60 req / 60s = 1 req/s
  });

  it("handles mixed success/failure", () => {
    metrics.record("s", "q", 100, true);
    metrics.record("s", "q", 200, false);
    metrics.record("s", "q", 300, true);
    const snap = metrics.getSnapshot();
    expect(snap.totalRequests).toBe(3);
    expect(snap.successRate).toBeCloseTo(2 / 3);
  });
});
