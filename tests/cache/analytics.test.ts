import { describe, it, expect, beforeEach } from "vitest";
import { CacheAnalytics } from "../../src/cache/analytics.js";

function makeAnalytics(overrides?: Record<string, unknown>) {
  return new CacheAnalytics({ enabled: true, sampleRate: 1.0, topKLimit: 10, maxKeysInMemory: 10000, flushIntervalMs: 60000, ...overrides });
}

describe("CacheAnalytics", () => {
  let analytics: CacheAnalytics;

  beforeEach(() => {
    analytics = makeAnalytics();
  });

  it("recordHit increments hits and latency", () => {
    analytics.recordHit("key1", 50);
    analytics.recordHit("key1", 30);
    const snap = analytics.getSnapshot();
    expect(snap.hits).toBe(2);
    expect(snap.avgLatencySavedMs).toBe(40);
  });

  it("recordMiss increments misses", () => {
    analytics.recordMiss("key1");
    analytics.recordMiss("key2");
    expect(analytics.getSnapshot().misses).toBe(2);
  });

  it("hitRate is 0 when no requests", () => {
    expect(analytics.getSnapshot().hitRate).toBe(0);
  });

  it("hitRate is 0.5 for equal hits/misses", () => {
    analytics.recordHit("a", 0);
    analytics.recordMiss("a");
    expect(analytics.getSnapshot().hitRate).toBe(0.5);
  });

  it("hitRate is 1.0 for all hits", () => {
    analytics.recordHit("a", 0);
    analytics.recordHit("b", 0);
    expect(analytics.getSnapshot().hitRate).toBe(1.0);
  });

  it("recordEviction increments evictions", () => {
    analytics.recordEviction("k1");
    analytics.recordEviction("k2");
    expect(analytics.getSnapshot().evictions).toBe(2);
  });

  it("getSnapshot returns total requests", () => {
    analytics.recordHit("a", 0);
    analytics.recordMiss("b");
    analytics.recordMiss("c");
    expect(analytics.getSnapshot().totalRequests).toBe(3);
  });

  it("topKeys sorted by hit count", () => {
    analytics.recordHit("c", 0);
    analytics.recordHit("a", 0);
    analytics.recordHit("a", 0);
    analytics.recordHit("b", 0);
    analytics.recordHit("a", 0);
    const topKeys = analytics.getSnapshot().topKeys;
    expect(topKeys[0].key).toBe("a");
    expect(topKeys[0].hits).toBe(3);
    expect(topKeys[1].key).toBe("c");
  });

  it("topKeys respects topKLimit", () => {
    const a = makeAnalytics({ topKLimit: 2 });
    a.recordHit("a", 0);
    a.recordHit("b", 0);
    a.recordHit("c", 0);
    expect(a.getSnapshot().topKeys).toHaveLength(2);
  });

  it("reset clears all counters", () => {
    analytics.recordHit("a", 10);
    analytics.recordMiss("b");
    analytics.recordEviction("k");
    analytics.reset();
    const snap = analytics.getSnapshot();
    expect(snap.hits).toBe(0);
    expect(snap.misses).toBe(0);
    expect(snap.evictions).toBe(0);
    expect(snap.topKeys).toHaveLength(0);
    expect(snap.totalRequests).toBe(0);
  });

  it("disabled mode does not record", () => {
    const off = makeAnalytics({ enabled: false });
    off.recordHit("a", 10);
    off.recordMiss("b");
    expect(off.getSnapshot().totalRequests).toBe(0);
    expect(off.getSnapshot().hits).toBe(0);
  });

  it("getTopKeys returns string array", () => {
    analytics.recordHit("z", 0);
    analytics.recordHit("y", 0);
    const keys = analytics.getTopKeys();
    expect(keys).toEqual(["z", "y"]);
  });

  it("flush is no-op (no throw)", async () => {
    await expect(analytics.flush()).resolves.toBeUndefined();
  });

  it("maxKeysInMemory limits key map growth", () => {
    const small = makeAnalytics({ maxKeysInMemory: 2, topKLimit: 2 });
    small.recordHit("a", 0);
    small.recordHit("b", 0);
    small.recordHit("c", 0); // exceeds limit
    // Should not crash
    expect(small.getSnapshot().topKeys).toHaveLength(2);
  });

  it("periodStart is set on construction", () => {
    const snap = analytics.getSnapshot();
    expect(snap.periodStart).toBeGreaterThan(0);
    expect(snap.periodStart).toBeLessThanOrEqual(Date.now());
  });
});
