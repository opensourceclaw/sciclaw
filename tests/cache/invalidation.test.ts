import { describe, it, expect } from "vitest";
import { InvalidationManager } from "../../src/cache/invalidation.js";

const BASE_PARAMS = {
  query: "typescript cache design",
  engines: ["duckduckgo"] as Array<"duckduckgo" | "google" | "bing">,
  accessCount: 0,
  lastAccessGapMs: 0,
};

describe("InvalidationManager", () => {
  describe("ttl strategy", () => {
    it("returns constant default TTL", () => {
      const m = new InvalidationManager({ strategy: "ttl", defaultTTL: 3600, sourceTTLs: {}, topicWindowMs: 1800000, minTTL: 300, maxTTL: 86400 });
      expect(m.computeTTL(BASE_PARAMS)).toBe(3600);
    });

    it("uses baseTTLSeconds when provided", () => {
      const m = new InvalidationManager({ strategy: "ttl", defaultTTL: 3600, sourceTTLs: {}, topicWindowMs: 1800000, minTTL: 300, maxTTL: 86400 });
      expect(m.computeTTL({ ...BASE_PARAMS, baseTTLSeconds: 100 })).toBe(100);
    });
  });

  describe("adaptive strategy", () => {
    it("returns default TTL for fresh entry", () => {
      const m = new InvalidationManager();
      const ttl = m.computeTTL({ ...BASE_PARAMS, baseTTLSeconds: 60 });
      // 60 * 1.0 * 1.0 * 1.2 = 72, clamped to min(300, 60) = 60 → max(60, min(86400, 72))
      expect(ttl).toBeGreaterThanOrEqual(60);
    });

    it("high frequency reduces TTL", () => {
      const m = new InvalidationManager();
      const normal = m.computeTTL({ ...BASE_PARAMS, baseTTLSeconds: 1000, accessCount: 0 });
      const frequent = m.computeTTL({ ...BASE_PARAMS, baseTTLSeconds: 1000, accessCount: 6 });
      expect(frequent).toBeLessThan(normal);
    });

    it("medium frequency moderately reduces TTL", () => {
      const m = new InvalidationManager();
      const normal = m.computeTTL({ ...BASE_PARAMS, baseTTLSeconds: 1000, accessCount: 0 });
      const medium = m.computeTTL({ ...BASE_PARAMS, baseTTLSeconds: 1000, accessCount: 3 });
      expect(medium).toBeLessThan(normal);
    });

    it("long gap extends TTL", () => {
      const m = new InvalidationManager();
      const normal = m.computeTTL({ ...BASE_PARAMS, baseTTLSeconds: 1000, lastAccessGapMs: 0 });
      const longGap = m.computeTTL({ ...BASE_PARAMS, baseTTLSeconds: 1000, lastAccessGapMs: 4_000_000 });
      expect(longGap).toBeGreaterThan(normal);
    });

    it("duckduckgo has higher source factor than google", () => {
      const m = new InvalidationManager();
      const ddg = m.computeTTL({ ...BASE_PARAMS, baseTTLSeconds: 1000, engines: ["duckduckgo"] });
      const goog = m.computeTTL({ ...BASE_PARAMS, baseTTLSeconds: 1000, engines: ["google"] });
      expect(ddg).toBeGreaterThan(goog);
    });

    it("respects minTTL clamping", () => {
      const m = new InvalidationManager({ minTTL: 500, maxTTL: 86400, defaultTTL: 3600, strategy: "adaptive", sourceTTLs: {}, topicWindowMs: 1800000 });
      const ttl = m.computeTTL({ ...BASE_PARAMS, baseTTLSeconds: 10 });
      expect(ttl).toBeGreaterThanOrEqual(10); // effectiveMin = min(500, 10) = 10
    });

    it("respects maxTTL clamping", () => {
      const m = new InvalidationManager({ minTTL: 1, maxTTL: 100, defaultTTL: 3600, strategy: "adaptive", sourceTTLs: {}, topicWindowMs: 1800000 });
      const ttl = m.computeTTL({ ...BASE_PARAMS, baseTTLSeconds: 5000 });
      expect(ttl).toBeLessThanOrEqual(100);
    });
  });

  describe("extractTopic", () => {
    it("extracts known keywords", () => {
      const m = new InvalidationManager();
      expect(m.extractTopic("docker swarm")).toBe("docker");
      expect(m.extractTopic("typescript generics inference")).toBe("typescript");
      expect(m.extractTopic("zyx abc no match")).toBe("zyx_abc_no_match");
    });
  });

  describe("topic_aware strategy", () => {
    it("forces minTTL after topic invalidation", () => {
      const m = new InvalidationManager({
        strategy: "topic_aware", defaultTTL: 3600, sourceTTLs: {},
        topicWindowMs: 60_000, minTTL: 30, maxTTL: 86400,
      });
      m.invalidateByTopic("kubernetes");
      const ttl = m.computeTTL({ ...BASE_PARAMS, baseTTLSeconds: 3600, query: "kubernetes pod failure" });
      expect(ttl).toBe(30);
    });

    it("returns base TTL when topic not invalidated", () => {
      const m = new InvalidationManager({
        strategy: "topic_aware", defaultTTL: 3600, sourceTTLs: {},
        topicWindowMs: 60_000, minTTL: 30, maxTTL: 86400,
      });
      const ttl = m.computeTTL({ ...BASE_PARAMS, baseTTLSeconds: 500 });
      expect(ttl).toBe(500);
    });
  });

  describe("source_aware strategy", () => {
    it("uses source-specific TTL", () => {
      const m = new InvalidationManager({
        strategy: "source_aware", defaultTTL: 3600,
        sourceTTLs: { duckduckgo: 600, google: 300 },
        topicWindowMs: 1800000, minTTL: 30, maxTTL: 86400,
      });
      const ttl = m.computeTTL({ ...BASE_PARAMS, baseTTLSeconds: 3600, engines: ["duckduckgo"] });
      expect(ttl).toBe(600);
    });

    it("uses minimum of all matching source TTLs", () => {
      const m = new InvalidationManager({
        strategy: "source_aware", defaultTTL: 3600,
        sourceTTLs: { duckduckgo: 600, google: 300 },
        topicWindowMs: 1800000, minTTL: 30, maxTTL: 86400,
      });
      const ttl = m.computeTTL({ ...BASE_PARAMS, baseTTLSeconds: 3600, engines: ["duckduckgo", "google"] });
      expect(ttl).toBe(300);
    });
  });

  describe("getConfig", () => {
    it("returns current config", () => {
      const m = new InvalidationManager();
      expect(m.getConfig().strategy).toBe("adaptive");
    });
  });
});
