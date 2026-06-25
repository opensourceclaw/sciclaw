import { describe, it, expect, vi } from "vitest";
import { CacheWarmer } from "../../src/cache/warmer.js";
import { CacheAnalytics } from "../../src/cache/analytics.js";
import type { SearchResult } from "../../src/types/index.js";

function makeSearchFn(delayMs = 0, failOn?: string[]) {
  return vi.fn(async (query: string, _engines: string[]) => {
    if (failOn?.includes(query)) throw new Error(`Search failed: ${query}`);
    await new Promise((r) => setTimeout(r, delayMs));
    return [{ title: query, url: `https://x.com/${query}`, snippet: "", source: "duckduckgo" as const }];
  });
}

describe("CacheWarmer", () => {
  it("does nothing when disabled", async () => {
    const analytics = new CacheAnalytics();
    const searchFn = makeSearchFn();
    const warmer = new CacheWarmer(
      { enabled: false, queries: ["a"], engines: ["duckduckgo"], concurrency: 2, timeoutMs: 5000, topKFromAnalytics: false, topKLimit: 10 },
      analytics, searchFn,
    );
    const result = await warmer.warm();
    expect(result.warmed).toBe(0);
    expect(result.failed).toBe(0);
    expect(searchFn).not.toHaveBeenCalled();
  });

  it("returns zero when no queries", async () => {
    const analytics = new CacheAnalytics();
    const searchFn = makeSearchFn();
    const warmer = new CacheWarmer({} as any, analytics, searchFn);
    const result = await warmer.warm();
    expect(result.warmed).toBe(0);
  });

  it("warms predefined queries", async () => {
    const analytics = new CacheAnalytics();
    const searchFn = makeSearchFn();
    const warmer = new CacheWarmer(
      { enabled: true, queries: ["q1", "q2"], engines: ["duckduckgo"], concurrency: 2, timeoutMs: 5000, topKFromAnalytics: false, topKLimit: 10 },
      analytics, searchFn,
    );
    const result = await warmer.warm();
    expect(result.warmed).toBe(2);
    expect(result.failed).toBe(0);
    expect(searchFn).toHaveBeenCalledTimes(2);
  });

  it("respects concurrency limit", async () => {
    const analytics = new CacheAnalytics();
    const searchFn = makeSearchFn(10);
    const warmer = new CacheWarmer(
      { enabled: true, queries: ["a", "b", "c", "d"], engines: ["duckduckgo"], concurrency: 2, timeoutMs: 5000, topKFromAnalytics: false, topKLimit: 10 },
      analytics, searchFn,
    );
    const result = await warmer.warm();
    expect(result.warmed).toBe(4);
  });

  it("handles search failures without blocking other queries", async () => {
    const analytics = new CacheAnalytics();
    const searchFn = makeSearchFn(0, ["q2"]);
    const warmer = new CacheWarmer(
      { enabled: true, queries: ["q1", "q2", "q3"], engines: ["duckduckgo"], concurrency: 2, timeoutMs: 5000, topKFromAnalytics: false, topKLimit: 10 },
      analytics, searchFn,
    );
    const result = await warmer.warm();
    expect(result.warmed).toBe(2);
    expect(result.failed).toBe(1);
    expect(searchFn).toHaveBeenCalledTimes(3);
  });

  it("supports addQuery for runtime queries", async () => {
    const analytics = new CacheAnalytics();
    const searchFn = makeSearchFn();
    const warmer = new CacheWarmer(
      { enabled: true, queries: ["predefined"], engines: ["duckduckgo"], concurrency: 2, timeoutMs: 5000, topKFromAnalytics: false, topKLimit: 10 },
      analytics, searchFn,
    );
    warmer.addQuery("runtime");
    const result = await warmer.warm();
    expect(result.warmed).toBe(2);
  });

  it("pulls top keys from analytics", async () => {
    const analytics = new CacheAnalytics();
    analytics.recordHit("a:hot_query", 0);
    analytics.recordHit("a:hot_query", 0);
    analytics.recordHit("b:warm_query", 0);

    const searchFn = makeSearchFn();
    const warmer = new CacheWarmer(
      { enabled: true, queries: [], engines: ["duckduckgo"], concurrency: 2, timeoutMs: 5000, topKFromAnalytics: true, topKLimit: 2 },
      analytics, searchFn,
    );
    const result = await warmer.warm();
    expect(result.warmed).toBe(2);
  });

  it("topKFromAnalytics disabled skips analytics keys", async () => {
    const analytics = new CacheAnalytics();
    analytics.recordHit("a:q", 0);

    const searchFn = makeSearchFn();
    const warmer = new CacheWarmer(
      { enabled: true, queries: [], engines: ["duckduckgo"], concurrency: 2, timeoutMs: 5000, topKFromAnalytics: false, topKLimit: 10 },
      analytics, searchFn,
    );
    const result = await warmer.warm();
    expect(result.warmed).toBe(0);
  });

  it("returns duration", async () => {
    const analytics = new CacheAnalytics();
    const searchFn = makeSearchFn(5);
    const warmer = new CacheWarmer(
      { enabled: true, queries: ["q"], engines: ["duckduckgo"], concurrency: 1, timeoutMs: 5000, topKFromAnalytics: false, topKLimit: 10 },
      analytics, searchFn,
    );
    const result = await warmer.warm();
    expect(result.durationMs).toBeGreaterThan(0);
  });
});
