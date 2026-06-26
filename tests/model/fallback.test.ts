import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenClawModelAdapter } from "../../src/model/adapter.js";
import { FallbackHandler } from "../../src/model/fallback.js";

function makeResponse(content: string, model: string) {
  return {
    content,
    model,
    provider: model.split("/")[0] ?? "unknown",
    latencyMs: 10,
  };
}

describe("FallbackHandler", () => {
  let adapter: OpenClawModelAdapter;

  beforeEach(() => {
    adapter = new OpenClawModelAdapter();
  });

  describe("execute", () => {
    it("returns primary model result when it succeeds", async () => {
      const res = makeResponse("hello", "anthropic/claude-sonnet-4-6");
      vi.spyOn(adapter, "chat").mockResolvedValueOnce(res);

      const handler = new FallbackHandler(adapter);
      const result = await handler.execute(
        { messages: [{ role: "user", content: "test" }] },
        "anthropic/claude-sonnet-4-6",
      );

      expect(result).toEqual(res);
      expect(adapter.chat).toHaveBeenCalledTimes(1);
    });

    it("falls back to first fallback when primary fails", async () => {
      vi.spyOn(adapter, "chat")
        .mockRejectedValueOnce(new Error("Primary failed"))
        .mockResolvedValueOnce(makeResponse("fallback-ok", "openai/o3-mini"));

      const handler = new FallbackHandler(adapter);
      const result = await handler.execute(
        { messages: [{ role: "user", content: "test" }] },
        "anthropic/claude-sonnet-4-6",
      );

      expect(result.content).toBe("fallback-ok");
      expect(result.model).toBe("openai/o3-mini");
      expect(adapter.chat).toHaveBeenCalledTimes(2);
    });

    it("falls back to second fallback when first also fails", async () => {
      vi.spyOn(adapter, "chat")
        .mockRejectedValueOnce(new Error("Primary failed"))
        .mockRejectedValueOnce(new Error("Fallback 1 failed"))
        .mockResolvedValueOnce(makeResponse("fallback-2-ok", "google/gemini-3-flash-preview"));

      const handler = new FallbackHandler(adapter);
      const result = await handler.execute(
        { messages: [{ role: "user", content: "test" }] },
        "anthropic/claude-sonnet-4-6",
      );

      expect(result.content).toBe("fallback-2-ok");
      expect(result.model).toBe("google/gemini-3-flash-preview");
      expect(adapter.chat).toHaveBeenCalledTimes(3);
    });

    it("throws error when all primary and fallback models fail", async () => {
      vi.spyOn(adapter, "chat")
        .mockRejectedValueOnce(new Error("Primary failed"))
        .mockRejectedValueOnce(new Error("Fallback 1 failed"))
        .mockRejectedValueOnce(new Error("Fallback 2 failed"));

      const handler = new FallbackHandler(adapter);
      await expect(
        handler.execute(
          { messages: [{ role: "user", content: "test" }] },
          "anthropic/claude-sonnet-4-6",
        ),
      ).rejects.toThrow("All models failed");
    });

    it("includes all model names in error message when all fail", async () => {
      vi.spyOn(adapter, "chat").mockRejectedValue(new Error("fail"));

      const handler = new FallbackHandler(adapter);
      await expect(
        handler.execute(
          { messages: [{ role: "user", content: "test" }] },
          "anthropic/claude-sonnet-4-6",
        ),
      ).rejects.toThrow(/anthropic\/claude-sonnet-4-6/);
    });

    it("throws immediately when model has no fallbacks configured", async () => {
      vi.spyOn(adapter, "chat").mockRejectedValueOnce(new Error("fail"));

      const handler = new FallbackHandler(adapter, []); // empty fallbacks
      await expect(
        handler.execute(
          { messages: [{ role: "user", content: "test" }] },
          "unknown/model",
        ),
      ).rejects.toThrow("no fallbacks configured");
    });

    it("prepends fallback system message in fallback request", async () => {
      vi.spyOn(adapter, "chat")
        .mockRejectedValueOnce(new Error("Primary failed"))
        .mockResolvedValueOnce(makeResponse("fb", "openai/o3-mini"));

      const handler = new FallbackHandler(adapter);
      await handler.execute(
        {
          messages: [
            { role: "user", content: "original message" },
          ],
        },
        "anthropic/claude-sonnet-4-6",
      );

      const fallbackCall = (adapter.chat as any).mock.calls[1][0];
      expect(fallbackCall.messages[0].role).toBe("system");
      expect(fallbackCall.messages[0].content).toContain("Fallback");
      expect(fallbackCall.messages[0].content).toContain("anthropic/claude-sonnet-4-6");
      expect(fallbackCall.messages[1]).toEqual({ role: "user", content: "original message" });
    });
  });

  describe("addFallback", () => {
    it("adds new fallback chain", async () => {
      vi.spyOn(adapter, "chat")
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValueOnce(makeResponse("new-fb", "custom/fallback"));

      const handler = new FallbackHandler(adapter, []);
      handler.addFallback("custom/primary", ["custom/fallback"]);

      const result = await handler.execute(
        { messages: [{ role: "user", content: "test" }] },
        "custom/primary",
      );

      expect(result.model).toBe("custom/fallback");
    });

    it("overwrites existing fallback chain for same primary", () => {
      const handler = new FallbackHandler(adapter);
      handler.addFallback("anthropic/claude-sonnet-4-6", ["my/backup"]);

      expect(handler.getFallbacks("anthropic/claude-sonnet-4-6")).toEqual(["my/backup"]);
    });
  });

  describe("getFallbacks", () => {
    it("returns configured fallbacks for known primary", () => {
      const handler = new FallbackHandler(adapter);
      const fallbacks = handler.getFallbacks("anthropic/claude-sonnet-4-6");

      expect(fallbacks.length).toBe(2);
      expect(fallbacks).toContain("google/gemini-3-flash-preview");
    });

    it("returns empty array for unknown primary", () => {
      const handler = new FallbackHandler(adapter);
      expect(handler.getFallbacks("unknown/model")).toEqual([]);
    });

    it("returns empty array when no fallbacks configured", () => {
      const handler = new FallbackHandler(adapter, []);
      expect(handler.getFallbacks("any/model")).toEqual([]);
    });
  });

  describe("constructor", () => {
    it("initializes with default fallbacks", () => {
      const handler = new FallbackHandler(adapter);

      const opusFb = handler.getFallbacks("anthropic/claude-opus-4-6");
      expect(opusFb).toHaveLength(2);
      expect(opusFb[0]).toBe("openai/o3-mini");
    });

    it("initializes with custom fallbacks", () => {
      const custom = [
        { primary: "my/model", fallbacks: ["backup/one", "backup/two"] },
      ];
      const handler = new FallbackHandler(adapter, custom);

      expect(handler.getFallbacks("my/model")).toEqual(["backup/one", "backup/two"]);
      expect(handler.getFallbacks("anthropic/claude-sonnet-4-6")).toEqual([]);
    });
  });
});
