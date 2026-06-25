import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DistributedCache, type RedisLike, type RedisFactory } from "../../src/cache/distributed.js";
import { CacheCompressor } from "../../src/cache/compression.js";

function makeMockRedis(overrides?: Partial<RedisLike>): { redis: RedisLike; factory: RedisFactory } {
  const redis: RedisLike = {
    connect: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    setex: vi.fn().mockResolvedValue("OK"),
    quit: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    ...overrides,
  };
  const factory = vi.fn(() => redis);
  return { redis, factory };
}

describe("DistributedCache", () => {
  let dc: DistributedCache;

  afterEach(async () => {
    await dc.disconnect();
  });

  describe("disabled", () => {
    beforeEach(() => {
      dc = new DistributedCache(
        { ...{} as DistributedCacheConfig, enabled: false, fallback: "local" },
        new CacheCompressor(),
      );
    });

    it("connect returns false", async () => {
      expect(await dc.connect()).toBe(false);
    });

    it("isHealthy returns false", () => {
      expect(dc.isHealthy()).toBe(false);
    });

    it("get returns null", async () => {
      expect(await dc.get("k")).toBeNull();
    });

    it("set does not throw", async () => {
      await expect(dc.set("k", [], 60)).resolves.toBeUndefined();
    });
  });

  describe("with mock redis", () => {
    let mockRedis: RedisLike;
    let factory: RedisFactory;

    beforeEach(async () => {
      const m = makeMockRedis();
      mockRedis = m.redis;
      factory = m.factory;
      dc = new DistributedCache(
        {
          enabled: true,
          redis: { host: "127.0.0.1", port: 6379, db: 0, keyPrefix: "t:", connectTimeoutMs: 2000, maxRetries: 1 },
          fallback: "local",
        },
        new CacheCompressor(),
        factory,
      );
    });

    it("connect succeeds with factory", async () => {
      const ok = await dc.connect();
      expect(ok).toBe(true);
      expect(dc.isHealthy()).toBe(true);
      expect(factory).toHaveBeenCalled();
    });

    it("get returns decompressed results on hit", async () => {
      const compressor = new CacheCompressor();
      const { data } = compressor.compress([{ title: "T", url: "u", snippet: "", source: "duckduckgo" }]);
      (mockRedis.get as ReturnType<typeof vi.fn>).mockResolvedValue(data);

      await dc.connect();
      const result = await dc.get("k");
      expect(result).toHaveLength(1);
      expect(result![0].title).toBe("T");
    });

    it("get returns null when redis returns null", async () => {
      await dc.connect();
      expect(await dc.get("k")).toBeNull();
    });

    it("set stores compressed data", async () => {
      await dc.connect();
      await dc.set("k", [{ title: "T", url: "u", snippet: "", source: "duckduckgo" }], 60);
      expect(mockRedis.setex).toHaveBeenCalled();
    });

    it("get marks unhealthy on error", async () => {
      (mockRedis.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("fail"));
      await dc.connect();
      const result = await dc.get("k");
      expect(result).toBeNull();
      expect(dc.isHealthy()).toBe(false);
    });

    it("set marks unhealthy on error", async () => {
      (mockRedis.setex as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("fail"));
      await dc.connect();
      await dc.set("k", [{ title: "T", url: "u", snippet: "", source: "duckduckgo" }], 60);
      expect(dc.isHealthy()).toBe(false);
    });

    it("disconnect quits redis and clears timer", async () => {
      await dc.connect();
      await dc.disconnect();
      expect(mockRedis.quit).toHaveBeenCalled();
      expect(dc.isHealthy()).toBe(false);
    });

    it("error handler marks unhealthy", async () => {
      await dc.connect();
      // Trigger the error handler
      const errorHandler = (mockRedis.on as ReturnType<typeof vi.fn>).mock.calls.find(
        (c: string[]) => c[0] === "error",
      );
      expect(errorHandler).toBeDefined();
      errorHandler![1]();
      expect(dc.isHealthy()).toBe(false);
    });

    it("get returns null before connect", async () => {
      expect(await dc.get("k")).toBeNull();
    });

    it("set no-ops before connect", async () => {
      await dc.set("k", [], 60);
      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it("factory is called with correct config", async () => {
      await dc.connect();
      const callArg = (factory as ReturnType<typeof vi.fn>).mock.calls[0][0] as Record<string, unknown>;
      expect(callArg.host).toBe("127.0.0.1");
      expect(callArg.port).toBe(6379);
      expect(callArg.keyPrefix).toBe("t:");
    });

    it("disconnect clears healthy flag even without redis", async () => {
      await dc.disconnect();
      expect(dc.isHealthy()).toBe(false);
    });

    it("double disconnect is safe", async () => {
      await dc.connect();
      await dc.disconnect();
      await dc.disconnect();
      expect(dc.isHealthy()).toBe(false);
    });
  });
});
