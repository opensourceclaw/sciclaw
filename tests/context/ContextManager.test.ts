import { describe, it, expect, beforeEach } from "vitest";
import { ContextManager, contextManager } from "../../src/context/ContextManager.js";
import type { ResearchContext } from "../../src/context/ResearchContext.js";

function makeContext(overrides?: Partial<ResearchContext>): ResearchContext {
  return {
    topic: "AI safety",
    questions: ["What is AI alignment?", "How to ensure AI safety?"],
    searchResults: [
      { url: "https://example.com/1", title: "AI Alignment", snippet: "Overview", source: "web", timestamp: new Date().toISOString(), relevanceScore: 0.9 },
      { url: "https://example.com/2", title: "Safety Methods", snippet: "Methods", source: "web", timestamp: new Date().toISOString(), relevanceScore: 0.8 },
    ],
    extractions: [
      { id: "ext-1", source: "doc-1", content: "AI safety research", entities: [], relations: [], confidence: 0.9 },
      { id: "ext-2", source: "doc-2", content: "Alignment techniques", entities: [], relations: [], confidence: 0.85 },
    ],
    stage: "search",
    ...overrides,
  };
}

describe("ContextManager", () => {
  let manager: ContextManager;

  beforeEach(() => {
    manager = new ContextManager();
  });

  it("should create with default config", () => {
    expect(manager.getModelId()).toBe("deepseek-v4-flash");
  });

  it("should create with custom model profile", () => {
    const m = new ContextManager({ maxTokens: 50000 });
    expect(manager).toBeDefined();
    expect(m).toBeDefined();
  });

  it("should optimize context", async () => {
    const result = await manager.optimize(makeContext());
    expect(result.tokenCount).toBeGreaterThan(0);
    expect(result.hints.length).toBe(1);
    expect(result.hints[0].strategy).toBeDefined();
    expect(result.compactionRatio).toBeGreaterThanOrEqual(0);
  });

  it("should return hints with correct fields", async () => {
    const result = await manager.optimize(makeContext());
    const hint = result.hints[0];
    expect(hint.compressionThreshold).toBeGreaterThan(0);
    expect(hint.effectiveWindowRatio).toBeGreaterThan(0);
    expect(hint.maxContextTokens).toBeGreaterThan(0);
  });

  it("should set model profile", () => {
    const mockProfile = {
      id: "test-model",
      name: "Test Model",
      provider: "Test",
      cache: { staticPrefixBonus: false, supported: true },
      context: { maxTokens: 100000, effectiveWindowRatio: 0.8, prefersSummary: false },
      optimization: { strategy: "static-prefix" as const, preloadPriority: ["docs"], compressionThreshold: 80000 },
    };

    manager.setModelProfile(mockProfile);
    expect(manager.getModelId()).toBe("test-model");
  });

  it("should return context window", () => {
    const window = manager.getContextWindow();
    expect(window.max).toBeGreaterThan(0);
    expect(window.effective).toBeGreaterThan(0);
  });

  it("should return compression threshold", () => {
    const threshold = manager.getCompressionThreshold();
    expect(threshold).toBeGreaterThan(0);
  });

  it("should estimate higher tokens for synthesis stage", async () => {
    const searchCtx = makeContext({ stage: "search" });
    const synthCtx = makeContext({
      stage: "synthesize",
      synthesis: { summary: "AI safety is important for...", arguments: [], conclusions: ["We need alignment."], citations: [] },
    });

    const searchResult = await manager.optimize(searchCtx);
    const synthResult = await manager.optimize(synthCtx);

    expect(synthResult.tokenCount).toBeGreaterThan(searchResult.tokenCount);
  });

  it("should have correct compaction ratio", async () => {
    const result = await manager.optimize(makeContext());
    expect(result.compactionRatio).toBeGreaterThanOrEqual(0);
    expect(result.compactionRatio).toBeLessThanOrEqual(1);
  });

  it("should produce hints compatible with OptimizationHint type", async () => {
    const result = await manager.optimize(makeContext());
    const h = result.hints[0];
    expect(typeof h.strategy).toBe("string");
    expect(Array.isArray(h.preloadPriority)).toBe(true);
    expect(typeof h.cacheStaticPrefix).toBe("boolean");
    expect(typeof h.preferSummary).toBe("boolean");
    expect(typeof h.compressionThreshold).toBe("number");
    expect(typeof h.dynamicLoadingPreferred).toBe("boolean");
    expect(typeof h.stablePrefixRatio).toBe("number");
  });

  it("should use singleton contextManager", () => {
    expect(contextManager).toBeDefined();
    expect(contextManager.getModelId()).toBe("deepseek-v4-flash");
  });
});
