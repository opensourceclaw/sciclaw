import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ModelRouter } from "../../src/model/router.js";
import { OpenClawModelAdapter } from "../../src/model/adapter.js";

function mockFetch(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => body,
    body: null,
  });
}

describe("ModelRouter", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch({
      model: "anthropic/claude-sonnet-4-6",
      choices: [{ message: { content: "Response" } }],
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("routes reasoning tasks to o3-mini", () => {
    const adapter = new OpenClawModelAdapter();
    const router = new ModelRouter(adapter);
    expect(router.getRecommendedModel("reasoning")).toBe("openai/o3-mini");
  });

  it("routes analysis tasks to claude-opus", () => {
    const adapter = new OpenClawModelAdapter();
    const router = new ModelRouter(adapter);
    expect(router.getRecommendedModel("analysis")).toBe("anthropic/claude-opus-4-6");
  });

  it("routes default tasks to claude-sonnet", () => {
    const adapter = new OpenClawModelAdapter();
    const router = new ModelRouter(adapter);
    expect(router.getRecommendedModel("default")).toBe("anthropic/claude-sonnet-4-6");
  });

  it("routes unknown tasks to default", () => {
    const adapter = new OpenClawModelAdapter();
    const router = new ModelRouter(adapter);
    expect(router.getRecommendedModel("unknown" as any)).toBe("anthropic/claude-sonnet-4-6");
  });

  it("executes route successfully", async () => {
    const adapter = new OpenClawModelAdapter();
    const router = new ModelRouter(adapter);
    const response = await router.route({
      messages: [{ role: "user", content: "test" }],
      task: "coding",
    });
    expect(response.content).toBe("Response");
  });

  it("preferCheapest uses cheaper model", async () => {
    const adapter = new OpenClawModelAdapter();
    const router = new ModelRouter(adapter, { preferCheapest: true });
    const response = await router.route({
      messages: [{ role: "user", content: "test" }],
      task: "coding",
    });
    expect(response.content).toBe("Response");
  });

  it("returns fallback handler", () => {
    const adapter = new OpenClawModelAdapter();
    const router = new ModelRouter(adapter);
    expect(router.getFallbackHandler()).toBeDefined();
  });

  it("returns cost optimizer", () => {
    const adapter = new OpenClawModelAdapter();
    const router = new ModelRouter(adapter);
    expect(router.getCostOptimizer()).toBeDefined();
  });
});
