import { describe, it, expect } from "vitest";
import { CacheCompressor } from "../../src/cache/compression.js";
import type { SearchResult } from "../../src/types/index.js";

function makeResults(count: number): SearchResult[] {
  return Array.from({ length: count }, (_, i) => ({
    title: `Result ${i}`,
    url: `https://example.com/${i}`,
    snippet: `This is snippet number ${i} with some content`,
    source: "duckduckgo" as const,
    rank: i + 1,
  }));
}

describe("CacheCompressor", () => {
  it("compress + decompress round-trip preserves data", () => {
    const c = new CacheCompressor();
    const results = makeResults(5);
    const { data } = c.compress(results);
    const restored = c.decompress(data);
    expect(restored).toHaveLength(5);
    expect(restored[0].title).toBe("Result 0");
    expect(restored[0].url).toBe("https://example.com/0");
    expect(restored[0].source).toBe("duckduckgo");
  });

  it("handles empty results array", () => {
    const c = new CacheCompressor();
    const { data } = c.compress([]);
    const restored = c.decompress(data);
    expect(restored).toEqual([]);
  });

  it("handles corrupt data gracefully", () => {
    const c = new CacheCompressor();
    expect(c.decompress("{not json")).toEqual([]);
    expect(c.decompress("")).toEqual([]);
    expect(c.decompress("42")).toEqual([]);
  });

  it("compresses large results", () => {
    const c = new CacheCompressor();
    const results = makeResults(50);
    const { data, originalBytes, compressedBytes } = c.compress(results);
    expect(compressedBytes).toBeLessThan(originalBytes);
    expect(c.decompress(data)).toHaveLength(50);
  });

  it("does not compress small results below threshold", () => {
    const c = new CacheCompressor({ enabled: true, algorithm: "json", minBytesToCompress: 100000, level: "fast" });
    const results = makeResults(2);
    const { originalBytes, compressedBytes } = c.compress(results);
    expect(compressedBytes).toBe(originalBytes);
  });

  it("disabled mode returns original data", () => {
    const c = new CacheCompressor({ enabled: false, algorithm: "json", minBytesToCompress: 0, level: "fast" });
    const results = makeResults(10);
    const { data, originalBytes, compressedBytes } = c.compress(results);
    expect(compressedBytes).toBe(originalBytes);
    expect(c.decompress(data)).toHaveLength(10);
  });

  it("truncates long titles", () => {
    const c = new CacheCompressor({ enabled: true, algorithm: "json", minBytesToCompress: 0, level: "fast" });
    const longTitle = "x".repeat(300);
    const results: SearchResult[] = [{ title: longTitle, url: "a", snippet: "s", source: "duckduckgo" }];
    const { data } = c.compress(results);
    const restored = c.decompress(data);
    expect(restored[0].title.length).toBeLessThanOrEqual(200);
  });

  it("preserves rank when present", () => {
    const c = new CacheCompressor();
    const results: SearchResult[] = [
      { title: "T", url: "u", snippet: "", source: "duckduckgo", rank: 5 },
      { title: "T2", url: "u2", snippet: "", source: "duckduckgo" },
    ];
    const { data } = c.compress(results);
    const restored = c.decompress(data);
    expect(restored[0].rank).toBe(5);
    expect(restored[1].rank).toBeUndefined();
  });

  it("drops empty snippets", () => {
    const c = new CacheCompressor();
    const results: SearchResult[] = [{ title: "T", url: "u", snippet: "", source: "duckduckgo" }];
    const { data } = c.compress(results);
    expect(data).not.toContain('"s"');
    const restored = c.decompress(data);
    expect(restored[0].snippet).toBe("");
  });

  it("handles non-array JSON in decompress", () => {
    const c = new CacheCompressor();
    expect(c.decompress('{"a":1}')).toEqual([]);
  });

  it("handles single result round-trip", () => {
    const c = new CacheCompressor();
    const results: SearchResult[] = [{ title: "One", url: "url1", snippet: "snip", source: "google", rank: 1 }];
    const { data } = c.compress(results);
    const restored = c.decompress(data);
    expect(restored).toEqual(results);
  });

  it("decompress non-compact JSON format", () => {
    const c = new CacheCompressor();
    const results = makeResults(3);
    const regularJson = JSON.stringify(results);
    const restored = c.decompress(regularJson);
    expect(restored).toHaveLength(3);
    expect(restored[0].title).toBe("Result 0");
  });

  it("enabled=false returns original uncompressed data", () => {
    const c = new CacheCompressor({ enabled: false, algorithm: "json", minBytesToCompress: 0, level: "fast" });
    const results = makeResults(3);
    const { data } = c.compress(results);
    expect(() => JSON.parse(data)).not.toThrow();
    expect(c.decompress(data)).toHaveLength(3);
  });
});
