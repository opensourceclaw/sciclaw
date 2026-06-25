import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ConnectionPool } from "../../src/search/pool.js";

function createMockResponse(status = 200): Response {
  return {
    ok: status < 400,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: new Headers(),
    url: "https://example.com",
    redirected: false,
    type: "default" as ResponseType,
    body: null,
    bodyUsed: false,
    clone: () => createMockResponse(status),
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    json: async () => ({}),
    text: async () => "",
  } as Response;
}

describe("ConnectionPool", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("fetch", () => {
    it("fetches successfully and returns response", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(createMockResponse(200));
      const pool = new ConnectionPool();
      const res = await pool.fetch("https://example.com");
      expect(res.status).toBe(200);
      const stats = pool.getStats();
      expect(stats.totalRequests).toBe(1);
      expect(stats.reusedConnections).toBe(1);
    });

    it("increments active connections during fetch", async () => {
      let capturedActive = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        capturedActive = pool.getStats().activeConnections;
        return createMockResponse(200);
      });
      const pool = new ConnectionPool();
      await pool.fetch("https://example.com");
      expect(capturedActive).toBe(1);
      expect(pool.getStats().activeConnections).toBe(0);
    });

    it("retries on failure when retryOnError enabled", async () => {
      globalThis.fetch = vi.fn()
        .mockRejectedValueOnce(new Error("fail1"))
        .mockRejectedValueOnce(new Error("fail2"))
        .mockResolvedValueOnce(createMockResponse(200));

      const pool = new ConnectionPool({ retryOnError: true, maxRetries: 3 });
      const res = await pool.fetch("https://example.com");
      expect(res.status).toBe(200);
      expect(globalThis.fetch).toHaveBeenCalledTimes(3);
      const stats = pool.getStats();
      expect(stats.connectionErrors).toBe(2);
    });

    it("throws after exhausting retries", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("always fails"));
      const pool = new ConnectionPool({ retryOnError: true, maxRetries: 2 });
      await expect(pool.fetch("https://example.com")).rejects.toThrow("Connection failed after 2 retries");
      expect(pool.getStats().connectionErrors).toBe(3); // original + 2 retries
    });

    it("throws immediately when retryOnError disabled", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("fail"));
      const pool = new ConnectionPool({ retryOnError: false });
      await expect(pool.fetch("https://example.com")).rejects.toThrow("fail");
      expect(pool.getStats().connectionErrors).toBe(1);
    });

    it("throws when maxRetries is 0", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("fail"));
      const pool = new ConnectionPool({ retryOnError: true, maxRetries: 0 });
      await expect(pool.fetch("https://example.com")).rejects.toThrow("fail");
    });
  });

  describe("getStats", () => {
    it("returns initial zero stats", () => {
      const pool = new ConnectionPool();
      const stats = pool.getStats();
      expect(stats.activeConnections).toBe(0);
      expect(stats.idleConnections).toBe(0);
      expect(stats.totalRequests).toBe(0);
      expect(stats.reusedConnections).toBe(0);
      expect(stats.connectionErrors).toBe(0);
    });
  });

  describe("drain", () => {
    it("resets active connections", async () => {
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        return createMockResponse(200);
      });
      const pool = new ConnectionPool();
      await pool.fetch("https://example.com");
      await pool.drain();
      expect(pool.getStats().activeConnections).toBe(0);
    });
  });

  describe("close", () => {
    it("resets state", async () => {
      const pool = new ConnectionPool();
      await pool.close();
      expect(pool.getStats().activeConnections).toBe(0);
    });
  });

  describe("config", () => {
    it("uses default config values", () => {
      const pool = new ConnectionPool();
      const stats = pool.getStats();
      expect(stats).toBeDefined();
    });

    it("accepts custom keepAlive config", () => {
      const pool = new ConnectionPool({ keepAlive: false });
      expect(pool.getStats()).toBeDefined();
    });

    it("accepts custom maxConnections", () => {
      const pool = new ConnectionPool({ maxConnections: 100 });
      expect(pool.getStats()).toBeDefined();
    });
  });
});
