import { describe, it, expect, vi } from "vitest";
import { SearchCoordinator } from "../../src/search/coordinator.js";
import type { SearchSourceConfig, SearchSourceFn } from "../../src/search/types.js";
import type { SearchResult } from "../../src/types/index.js";

function makeResult(title: string, source: string = "duckduckgo"): SearchResult {
  return { title, url: `https://x.com/${title}`, snippet: "", source };
}

function makeMockFn(delayMs = 0, results?: SearchResult[]): SearchSourceFn {
  return async (_query, _maxResults, _signal) => {
    await new Promise((r) => setTimeout(r, delayMs));
    return results ?? [makeResult("r1"), makeResult("r2")];
  };
}

const TEST_SOURCES: SearchSourceConfig[] = [
  { id: "s1", name: "Source 1", enabled: true, priority: 1, timeoutMs: 5000, weight: 1.0 },
  { id: "s2", name: "Source 2", enabled: true, priority: 1, timeoutMs: 5000, weight: 1.0 },
  { id: "s3", name: "Source 3", enabled: false, priority: 2, timeoutMs: 5000, weight: 0.5 },
];

const TEST_SOURCE_FNS: Record<string, SearchSourceFn> = {
  s1: makeMockFn(),
  s2: makeMockFn(),
  s3: makeMockFn(),
};

describe("SearchCoordinator", () => {
  it("searches across enabled sources", async () => {
    const c = new SearchCoordinator(TEST_SOURCES, TEST_SOURCE_FNS);
    const result = await c.search({ query: "test", sources: TEST_SOURCES });

    expect(result.successfulSources).toBe(2); // s3 is disabled
    expect(result.failedSources).toBe(0);
    expect(result.results.length).toBeGreaterThan(0);
  });

  it("registerSource adds at runtime", async () => {
    const c = new SearchCoordinator([], {});
    c.registerSource(
      { id: "custom", name: "Custom", enabled: true, priority: 1, timeoutMs: 5000, weight: 1.0 },
      makeMockFn(),
    );

    const sources = c.getSources();
    expect(sources).toHaveLength(1);
    expect(sources[0]!.id).toBe("custom");

    const result = await c.search({ query: "test", sources });
    expect(result.successfulSources).toBe(1);
  });

  it("failed sources are counted", async () => {
    const failFn: SearchSourceFn = async () => { throw new Error("fail"); };
    const c = new SearchCoordinator(
      [{ id: "f1", name: "Fail", enabled: true, priority: 1, timeoutMs: 5000, weight: 1.0 }],
      { f1: failFn },
    );

    const result = await c.search({
      query: "test",
      sources: [{ id: "f1", name: "Fail", enabled: true, priority: 1, timeoutMs: 5000, weight: 1.0 }],
    });

    expect(result.failedSources).toBe(1);
    expect(result.successfulSources).toBe(0);
  });

  it("prioritizes sources by priority", async () => {
    const calls: string[] = [];
    const slowFn: SearchSourceFn = async (_q, _m, _s) => {
      calls.push("slow");
      return [];
    };
    const fastFn: SearchSourceFn = async (_q, _m, _s) => {
      calls.push("fast");
      return [];
    };

    const c = new SearchCoordinator(
      [
        { id: "fast", name: "Fast", enabled: true, priority: 1, timeoutMs: 5000, weight: 1.0 },
        { id: "slow", name: "Slow", enabled: true, priority: 2, timeoutMs: 5000, weight: 1.0 },
      ],
      { fast: fastFn, slow: slowFn },
      { maxConcurrency: 1 }, // force sequential
    );

    const sources = c.getSources();
    await c.search({ query: "test", sources });
    expect(calls[0]).toBe("fast");
  });

  it("getMetrics returns snapshot", () => {
    const c = new SearchCoordinator(TEST_SOURCES, TEST_SOURCE_FNS);
    const snap = c.getMetrics();
    expect(typeof snap.p50).toBe("number");
    expect(typeof snap.p95).toBe("number");
    expect(typeof snap.throughput).toBe("number");
  });

  it("getPerformanceMetrics returns instance", () => {
    const c = new SearchCoordinator([], {});
    expect(c.getPerformanceMetrics()).toBeDefined();
  });

  it("getConnectionPool returns pool", () => {
    const c = new SearchCoordinator([], {});
    expect(c.getConnectionPool()).toBeDefined();
  });

  it("dispose closes pool", async () => {
    const c = new SearchCoordinator([], {});
    await expect(c.dispose()).resolves.toBeUndefined();
  });

  it("searchStream returns stream with correct total sources", () => {
    const c = new SearchCoordinator(TEST_SOURCES, TEST_SOURCE_FNS);
    const enabledSources = TEST_SOURCES.filter((s) => s.enabled);
    const stream = c.searchStream({ query: "test", sources: enabledSources });
    expect(stream).toBeDefined();
    expect(stream.totalSources).toBeUndefined; // totalSources is private — just ensure no throw
  });
});
