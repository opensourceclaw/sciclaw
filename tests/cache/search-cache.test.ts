import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SearchCache } from "../../src/cache/search-cache.js";
import { clearCache } from "../../src/cache/index.js";
import type { SearchResult } from "../../src/types/index.js";

function makeResult(title: string): SearchResult {
  return { title, url: `https://x.com/${title}`, snippet: "s", source: "duckduckgo" };
}

describe("SearchCache (extended)", () => {
  let cache: SearchCache;

  beforeEach(() => {
    cache = new SearchCache({ ttl: 3600, maxSize: 100 });
  });

  afterEach(async () => {
    await cache.dispose();
    clearCache();
  });

  describe("getMetrics", () => {
    it("returns hitRate after hits and misses", async () => {
      cache.set("q", ["duckduckgo"], [makeResult("r")]);
      await cache.get("q", ["duckduckgo"]);
      await cache.get("missing", ["duckduckgo"]);
      const metrics = cache.getMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(1);
      expect(metrics.hitRate).toBe(0.5);
    });

    it("returns memory and compressed bytes", () => {
      cache.set("q", ["duckduckgo"], [makeResult("r")]);
      const metrics = cache.getMetrics();
      expect(metrics.memoryBytes).toBeGreaterThan(0);
      expect(metrics.compressedBytes).toBeGreaterThan(0);
    });

    it("returns topKeys via analytics", async () => {
      cache.set("q1", ["duckduckgo"], [makeResult("a")]);
      await cache.get("q1", ["duckduckgo"]);
      await cache.get("q1", ["duckduckgo"]);
      cache.set("q2", ["duckduckgo"], [makeResult("b")]);
      await cache.get("q2", ["duckduckgo"]);

      const metrics = cache.getMetrics();
      expect(metrics.topKeys.length).toBeGreaterThan(0);
    });
  });

  describe("invalidate", () => {
    it("removes specific entry", async () => {
      cache.set("q", ["duckduckgo"], [makeResult("r")]);
      cache.invalidate("q", ["duckduckgo"]);
      expect(await cache.get("q", ["duckduckgo"])).toBeNull();
    });

    it("other entries survive", async () => {
      cache.set("q1", ["duckduckgo"], [makeResult("a")]);
      cache.set("q2", ["duckduckgo"], [makeResult("b")]);
      cache.invalidate("q1", ["duckduckgo"]);
      expect(await cache.get("q1", ["duckduckgo"])).toBeNull();
      expect(await cache.get("q2", ["duckduckgo"])).not.toBeNull();
    });
  });

  describe("LRU eviction order", () => {
    it("evicts least recently accessed", async () => {
      const small = new SearchCache({ ttl: 3600, maxSize: 3 });
      small.set("a", ["duckduckgo"], [makeResult("1")]);
      small.set("b", ["duckduckgo"], [makeResult("2")]);
      small.set("c", ["duckduckgo"], [makeResult("3")]);

      // Access a and b, leaving c as LRU
      await small.get("a", ["duckduckgo"]);
      await small.get("b", ["duckduckgo"]);

      // Insert d → should evict c
      small.set("d", ["duckduckgo"], [makeResult("4")]);

      expect(await small.get("a", ["duckduckgo"])).not.toBeNull();
      expect(await small.get("b", ["duckduckgo"])).not.toBeNull();
      expect(await small.get("c", ["duckduckgo"])).toBeNull();
      expect(await small.get("d", ["duckduckgo"])).not.toBeNull();
      await small.dispose();
    });
  });

  describe("getAnalytics", () => {
    it("returns analytics instance", () => {
      const a = cache.getAnalytics();
      expect(a).toBeDefined();
      expect(typeof a.getSnapshot).toBe("function");
    });
  });

  describe("getDistributed", () => {
    it("returns null when distributed not configured", () => {
      expect(cache.getDistributed()).toBeNull();
    });
  });

  describe("warm", () => {
    it("returns zero when warmer not set", async () => {
      const result = await cache.warm();
      expect(result.warmed).toBe(0);
    });
  });

  describe("connectDistributed", () => {
    it("returns false when distributed not configured", async () => {
      expect(await cache.connectDistributed()).toBe(false);
    });
  });

  describe("cleanExpired", () => {
    it("returns 0 when nothing expired", () => {
      cache.set("q", ["duckduckgo"], [makeResult("r")]);
      expect(cache.cleanExpired()).toBe(0);
    });
  });

  describe("getKey", () => {
    it("generates deterministic keys", () => {
      const k1 = cache.getKey("test", ["duckduckgo", "google"]);
      const k2 = cache.getKey("test", ["google", "duckduckgo"]);
      expect(k1).toBe(k2);
    });

    it("different queries produce different keys", () => {
      const k1 = cache.getKey("a", ["duckduckgo"]);
      const k2 = cache.getKey("b", ["duckduckgo"]);
      expect(k1).not.toBe(k2);
    });
  });

  describe("dispose", () => {
    it("clears cache and disconnects", async () => {
      cache.set("q", ["duckduckgo"], [makeResult("r")]);
      await cache.dispose();
      expect(await cache.get("q", ["duckduckgo"])).toBeNull();
    });
  });

  describe("getStats", () => {
    it("returns stats with hitRate", () => {
      cache.set("q", ["duckduckgo"], [makeResult("r")]);
      const stats = cache.getStats();
      expect(stats.size).toBe(1);
      expect(stats.maxSize).toBe(100);
      expect(stats.ttl).toBe(3600);
      expect(typeof stats.hitRate).toBe("number");
    });
  });

  describe("compression integration", () => {
    it("compress + decompress preserves data through get/set", async () => {
      const results: SearchResult[] = [
        { title: "Test", url: "https://x.com", snippet: "A snippet", source: "duckduckgo", rank: 1 },
      ];
      cache.set("compressed", ["duckduckgo"], results);
      const retrieved = await cache.get("compressed", ["duckduckgo"]);
      expect(retrieved).toEqual(results);
    });
  });
});
