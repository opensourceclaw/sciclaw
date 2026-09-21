/**
 * GA-A2 acceptance face — core/model router (model selection + fallback on the
 * live path). Stub adapter: no network.
 */
import { describe, it, expect, vi } from "vitest";
import { ModelRouter } from "../../src/core/model/router.js";
import type { OpenClawModelAdapter } from "../../src/core/model/adapter.js";
import type { ModelRequest, ModelResponse } from "../../src/core/model/types.js";

function makeAdapter(impl?: (req: ModelRequest) => Promise<ModelResponse>): {
  adapter: OpenClawModelAdapter;
  chat: ReturnType<typeof vi.fn>;
} {
  const chat = vi.fn(impl ?? (async (req: ModelRequest) => ({
    content: "ok",
    model: "stub/echo",
    provider: "stub" as never,
    latencyMs: 1,
    ...(req.messages.length ? {} : {}),
  })));
  return { adapter: { chat } as unknown as OpenClawModelAdapter, chat };
}

const REQUEST: ModelRequest = { messages: [{ role: "user", content: "hi" }] };

describe("ModelRouter (GA-A2 acceptance face)", () => {
  it("maps task categories to their configured default models", () => {
    const { adapter } = makeAdapter();
    const router = new ModelRouter(adapter);

    expect(router.getRecommendedModel("reasoning")).toBe("openai/o3-mini");
    expect(router.getRecommendedModel("coding")).toBe("anthropic/claude-sonnet-4-6");
    expect(router.getRecommendedModel("default")).toBe("anthropic/claude-sonnet-4-6");
  });

  it("routes through the adapter and returns its response", async () => {
    const { adapter, chat } = makeAdapter();
    const router = new ModelRouter(adapter);

    const res = await router.route({ ...REQUEST, task: "reasoning" });

    expect(res.content).toBe("ok");
    expect(chat).toHaveBeenCalledTimes(1);
  });

  it("falls back through the handler when the primary call fails and fallbacks exist", async () => {
    let calls = 0;
    const { adapter } = makeAdapter(async () => {
      calls++;
      if (calls === 1) throw new Error("primary down");
      return { content: "fallback-ok", model: "fb", provider: "stub" as never, latencyMs: 1 };
    });
    const router = new ModelRouter(adapter);
    router.getFallbackHandler().addFallback(router.getRecommendedModel("reasoning"), ["stub/fb-1"]);

    const res = await router.route({ ...REQUEST, task: "reasoning" });
    expect(res.content).toBe("fallback-ok");
    expect(calls).toBe(2);
  });

  it("throws clearly when every model in the fallback chain fails", async () => {
    const { adapter } = makeAdapter(async () => {
      throw new Error("primary down");
    });
    const router = new ModelRouter(adapter);
    await expect(router.route({ ...REQUEST, task: "default" })).rejects.toThrow(/All models failed/);
  });

  it("exposes the cost optimizer and honors preferCheapest without breaking routing", async () => {
    const { adapter, chat } = makeAdapter();
    const router = new ModelRouter(adapter, { preferCheapest: true });
    expect(router.getCostOptimizer()).toBeDefined();

    const res = await router.route({ ...REQUEST, task: "summarization" });
    expect(res.content).toBe("ok");
    expect(chat).toHaveBeenCalledTimes(1);
  });
});
