import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OpenClawModelAdapter } from "../../src/model/adapter.js";

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: async () => body,
    body: null,
  });
}

function createMockStream(...chunks: string[]) {
  const encoder = new TextEncoder();
  return {
    getReader: () => {
      let idx = 0;
      return {
        read: async () => {
          if (idx >= chunks.length) return { done: true } as const;
          return { done: false, value: encoder.encode(chunks[idx++]) };
        },
      };
    },
  };
}

function mockFetchStream(status: number, chunks: string[]) {
  return vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: undefined,
    body: createMockStream(...chunks),
  });
}

describe("OpenClawModelAdapter", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("chat", () => {
    it("sends request and returns response", async () => {
      globalThis.fetch = mockFetch(200, {
        model: "anthropic/claude-sonnet-4-6",
        choices: [{ message: { content: "Hello, world!" } }],
        usage: { prompt_tokens: 10, completion_tokens: 5 },
      });

      const adapter = new OpenClawModelAdapter();
      const response = await adapter.chat({
        messages: [{ role: "user", content: "Hello" }],
      });

      expect(response.content).toBe("Hello, world!");
      expect(response.model).toBe("anthropic/claude-sonnet-4-6");
      expect(response.provider).toBe("anthropic");
      expect(response.usage?.inputTokens).toBe(10);
      expect(response.usage?.outputTokens).toBe(5);
      expect(response.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it("handles gateway error", async () => {
      globalThis.fetch = mockFetch(500, { error: "Internal error" });

      const adapter = new OpenClawModelAdapter();
      await expect(
        adapter.chat({ messages: [{ role: "user", content: "Hello" }] }),
      ).rejects.toThrow("OpenClaw Gateway error");
    });

    it("handles network error", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Connection refused"));

      const adapter = new OpenClawModelAdapter();
      await expect(
        adapter.chat({ messages: [{ role: "user", content: "Hello" }] }),
      ).rejects.toThrow("Connection refused");
    });

    it("handles HTTP 403 forbidden", async () => {
      globalThis.fetch = mockFetch(403, { error: "Forbidden" });

      const adapter = new OpenClawModelAdapter();
      await expect(
        adapter.chat({ messages: [{ role: "user", content: "Hello" }] }),
      ).rejects.toThrow("OpenClaw Gateway error: 403");
    });

    it("handles timeout", async () => {
      vi.useFakeTimers();
      const abortSpy = vi.spyOn(AbortController.prototype, "abort");
      globalThis.fetch = vi.fn().mockImplementation(
        () => new Promise(() => {}),
      );

      const adapter = new OpenClawModelAdapter({ timeoutMs: 5000 });
      const promise = adapter.chat({
        messages: [{ role: "user", content: "Hello" }],
      });

      vi.advanceTimersByTime(5000);
      expect(abortSpy).toHaveBeenCalled();

      vi.useRealTimers();
      abortSpy.mockRestore();
      promise.catch(() => {});
    });

    it("handles api error response with invalid json body", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        statusText: "Bad Gateway",
      });

      const adapter = new OpenClawModelAdapter();
      await expect(
        adapter.chat({ messages: [{ role: "user", content: "Hello" }] }),
      ).rejects.toThrow("OpenClaw Gateway error: 502");
    });

    it("handles missing choices gracefully", async () => {
      globalThis.fetch = mockFetch(200, { model: "test/model", choices: [] });

      const adapter = new OpenClawModelAdapter();
      const response = await adapter.chat({
        messages: [{ role: "user", content: "Hello" }],
      });

      expect(response.content).toBe("");
    });

    it("resolves model correctly with options", async () => {
      globalThis.fetch = mockFetch(200, {
        choices: [{ message: { content: "Hi" } }],
      });

      const adapter = new OpenClawModelAdapter();
      const response = await adapter.chat({
        messages: [{ role: "user", content: "Test" }],
        options: { temperature: 0.7 },
      });

      expect(response.content).toBe("Hi");
    });

    it("sends Authorization header when apiKey is configured", async () => {
      const mockFn = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: "ok" } }] }),
      });
      globalThis.fetch = mockFn;

      const adapter = new OpenClawModelAdapter({ apiKey: "sk-test-123" });
      await adapter.chat({ messages: [{ role: "user", content: "Hello" }] });

      const options = mockFn.mock.calls[0][1];
      expect(options.headers.Authorization).toBe("Bearer sk-test-123");
    });
  });

  describe("chatStream", () => {
    it("streams tokens via onToken callback", async () => {
      globalThis.fetch = mockFetchStream(200, [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
        'data: [DONE]\n\n',
      ]);

      const adapter = new OpenClawModelAdapter({ timeoutMs: 30000 });
      const tokens: string[] = [];
      const response = await adapter.chatStream(
        { messages: [{ role: "user", content: "Hi" }] },
        (token) => tokens.push(token),
      );

      expect(tokens).toEqual(["Hello", " world"]);
      expect(response.content).toBe("Hello world");
      expect(response.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it("handles stream with no response body", async () => {
      globalThis.fetch = mockFetch(200, {});

      const adapter = new OpenClawModelAdapter({ timeoutMs: 30000 });
      await expect(
        adapter.chatStream(
          { messages: [{ role: "user", content: "Hi" }] },
          () => {},
        ),
      ).rejects.toThrow("No response body");
    });

    it("handles gateway error in stream", async () => {
      globalThis.fetch = mockFetch(503, {});

      const adapter = new OpenClawModelAdapter({ timeoutMs: 30000 });
      await expect(
        adapter.chatStream(
          { messages: [{ role: "user", content: "Hi" }] },
          () => {},
        ),
      ).rejects.toThrow("OpenClaw Gateway error");
    });

    it("skips unparseable JSON chunks gracefully", async () => {
      globalThis.fetch = mockFetchStream(200, [
        'data: {invalid json}\n\n',
        'data: {"choices":[{"delta":{"content":"valid"}}]}\n\n',
        'data: [DONE]\n\n',
      ]);

      const adapter = new OpenClawModelAdapter({ timeoutMs: 30000 });
      const tokens: string[] = [];
      const response = await adapter.chatStream(
        { messages: [{ role: "user", content: "Hi" }] },
        (token) => tokens.push(token),
      );

      expect(tokens).toEqual(["valid"]);
      expect(response.content).toBe("valid");
    });

    it("handles empty token content gracefully", async () => {
      globalThis.fetch = mockFetchStream(200, [
        'data: {"choices":[{"delta":{}}]}\n\n',
        'data: [DONE]\n\n',
      ]);

      const adapter = new OpenClawModelAdapter({ timeoutMs: 30000 });
      const tokens: string[] = [];
      const response = await adapter.chatStream(
        { messages: [{ role: "user", content: "Hi" }] },
        (token) => tokens.push(token),
      );

      expect(tokens).toEqual([]);
      expect(response.content).toBe("");
    });

    it("includes options in stream request body", async () => {
      const mockFn = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        body: createMockStream(
          'data: {"choices":[{"delta":{"content":"X"}}]}\n\n',
          'data: [DONE]\n\n',
        ),
      });
      globalThis.fetch = mockFn;

      const adapter = new OpenClawModelAdapter({
        apiKey: "sk-stream",
        timeoutMs: 30000,
      });
      await adapter.chatStream(
        {
          messages: [{ role: "user", content: "Hi" }],
          options: { temperature: 0.3, maxTokens: 512 },
        },
        () => {},
      );

      const body = JSON.parse(mockFn.mock.calls[0][1].body);
      expect(body.temperature).toBe(0.3);
      expect(body.max_tokens).toBe(512);
      expect(body.stream).toBe(true);
      expect(mockFn.mock.calls[0][1].headers.Authorization).toBe("Bearer sk-stream");
    });

    it("handles multi-token SSE lines in single chunk", async () => {
      const chunk = [
        'data: {"choices":[{"delta":{"content":"A"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"B"}}]}\n\n',
        'data: [DONE]\n\n',
      ].join("");

      globalThis.fetch = mockFetchStream(200, [chunk]);

      const adapter = new OpenClawModelAdapter({ timeoutMs: 30000 });
      const tokens: string[] = [];
      const response = await adapter.chatStream(
        { messages: [{ role: "user", content: "Hi" }] },
        (token) => tokens.push(token),
      );

      expect(tokens).toEqual(["A", "B"]);
      expect(response.content).toBe("AB");
    });
  });

  describe("healthCheck", () => {
    it("returns true when gateway is reachable", async () => {
      globalThis.fetch = mockFetch(200, { data: [] });

      const adapter = new OpenClawModelAdapter();
      expect(await adapter.healthCheck()).toBe(true);
    });

    it("returns false when gateway is unreachable", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const adapter = new OpenClawModelAdapter();
      expect(await adapter.healthCheck()).toBe(false);
    });

    it("returns false for non-ok response", async () => {
      globalThis.fetch = mockFetch(500, {});

      const adapter = new OpenClawModelAdapter();
      expect(await adapter.healthCheck()).toBe(false);
    });
  });

  describe("listModels", () => {
    it("returns model list from gateway", async () => {
      globalThis.fetch = mockFetch(200, {
        data: [{ id: "model-1" }, { id: "model-2" }],
      });

      const adapter = new OpenClawModelAdapter();
      const models = await adapter.listModels();
      expect(models).toEqual(["model-1", "model-2"]);
    });

    it("returns empty on network error", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const adapter = new OpenClawModelAdapter();
      expect(await adapter.listModels()).toEqual([]);
    });

    it("returns empty on non-ok response", async () => {
      globalThis.fetch = mockFetch(500, {});

      const adapter = new OpenClawModelAdapter();
      expect(await adapter.listModels()).toEqual([]);
    });

    it("handles missing data field in response", async () => {
      globalThis.fetch = mockFetch(200, {});

      const adapter = new OpenClawModelAdapter();
      expect(await adapter.listModels()).toEqual([]);
    });
  });

  describe("config", () => {
    it("uses custom baseUrl", () => {
      const adapter = new OpenClawModelAdapter({ baseUrl: "http://custom:8080" });
      expect(adapter.getConfig().baseUrl).toBe("http://custom:8080");
    });

    it("uses custom apiKey", () => {
      const adapter = new OpenClawModelAdapter({ apiKey: "secret" });
      expect(adapter.getConfig().apiKey).toBe("secret");
    });

    it("uses default config when no overrides", () => {
      const adapter = new OpenClawModelAdapter();
      const config = adapter.getConfig();
      expect(config.baseUrl).toBe("http://127.0.0.1:18789");
      expect(config.timeoutMs).toBe(60_000);
      expect(config.defaultModel).toBe("anthropic/claude-sonnet-4-6");
    });

    it("getConfig returns a copy, not a reference", () => {
      const adapter = new OpenClawModelAdapter();
      const cfg1 = adapter.getConfig();
      cfg1.baseUrl = "modified";
      expect(adapter.getConfig().baseUrl).toBe("http://127.0.0.1:18789");
    });
  });
});
