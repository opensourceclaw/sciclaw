/**
 * DeepClaw v3.0.0-rc.3 — Search Optimizer Tests
 */
import { describe, it, expect } from "vitest";
import { SearchOptimizer, createSearchOptimizer } from "../../src/search/optimizer.js";
import type { SearchResult, SearchEngine } from "../../src/types/index.js";

function makeResult(url: string): SearchResult {
  return {
    title: "Test",
    url,
    snippet: "Test result",
    source: "duckduckgo",
  };
}

describe("SearchOptimizer", () => {
  it("creates with default maxBatchSize", () => {
    const so = new SearchOptimizer();
    expect(so).toBeDefined();
  });

  it("creates with factory function", () => {
    const so = createSearchOptimizer(3);
    expect(so).toBeInstanceOf(SearchOptimizer);
  });

  it("creates with custom maxBatchSize", () => {
    const so = new SearchOptimizer(10);
    expect(so).toBeDefined();
  });

  it("normalizeUrl strips protocol", () => {
    expect(SearchOptimizer.normalizeUrl("https://example.com/page")).toBe("example.com/page");
  });

  it("normalizeUrl strips www", () => {
    expect(SearchOptimizer.normalizeUrl("https://www.example.com")).toBe("example.com");
  });

  it("normalizeUrl strips trailing slash", () => {
    expect(SearchOptimizer.normalizeUrl("https://example.com/")).toBe("example.com");
  });

  it("normalizeUrl lowercases", () => {
    expect(SearchOptimizer.normalizeUrl("HTTPS://Example.COM/Page")).toBe("example.com/page");
  });

  it("deduplicateResults removes URL duplicates", () => {
    const results = [
      makeResult("https://example.com/a"),
      makeResult("https://example.com/a"), // duplicate
      makeResult("https://example.com/b"),
    ];
    const deduped = SearchOptimizer.deduplicateResults(results);
    expect(deduped.length).toBe(2);
  });

  it("deduplicateResults handles www and non-www as same", () => {
    const results = [
      makeResult("https://www.example.com"),
      makeResult("https://example.com"),
    ];
    const deduped = SearchOptimizer.deduplicateResults(results);
    expect(deduped.length).toBe(1);
  });

  it("deduplicateResults handles trailing slashes", () => {
    const results = [
      makeResult("https://example.com/"),
      makeResult("https://example.com"),
    ];
    const deduped = SearchOptimizer.deduplicateResults(results);
    expect(deduped.length).toBe(1);
  });

  it("deduplicates concurrent in-flight requests", async () => {
    const so = new SearchOptimizer();
    const engines: SearchEngine[] = ["duckduckgo"];

    let callCount = 0;
    const searchFn = async (_q: string, _e: SearchEngine[]) => {
      callCount++;
      return [makeResult("https://example.com/result")];
    };

    // Fire 3 concurrent requests for same query
    const results = await Promise.all([
      so.deduplicatedSearch("test", engines, searchFn),
      so.deduplicatedSearch("test", engines, searchFn),
      so.deduplicatedSearch("test", engines, searchFn),
    ]);

    // All should return same result, and searchFn should only be called once
    expect(callCount).toBe(1);
    expect(results[0]).toEqual(results[1]);
    expect(results[1]).toEqual(results[2]);
  });

  it("batchSearch processes queries in batches", async () => {
    const so = new SearchOptimizer(2); // batch size 2
    const engines: SearchEngine[] = ["duckduckgo"];

    const searchFn = async (q: string, _e: SearchEngine[]) => {
      return [makeResult(`https://example.com/${q.replace(/\s/g, "-")}`)];
    };

    const results = await so.batchSearch(
      ["query 1", "query 2", "query 3", "query 4", "query 5"],
      engines,
      searchFn,
    );

    expect(results.size).toBe(5);
    for (const q of ["query 1", "query 2", "query 3", "query 4", "query 5"]) {
      expect(results.get(q)).toBeDefined();
    }
  });

  it("predictQueries generates query variants", () => {
    const so = new SearchOptimizer();
    const predictions = so.predictQueries("AI Safety");
    expect(predictions.length).toBeGreaterThan(0);
    expect(predictions.every((p) => p.includes("AI Safety"))).toBe(true);
  });

  it("inFlightCount tracks pending requests", () => {
    const so = new SearchOptimizer();
    expect(so.inFlightCount).toBe(0);
  });
});
