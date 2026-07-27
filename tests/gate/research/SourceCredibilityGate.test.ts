import { describe, it, expect } from "vitest";
import { SourceCredibilityGate } from "../../../src/gate/research/source-credibility-gate.js";
import type { ResearchContext } from "../../../src/context/ResearchContext.js";

function makeCtx(results: Array<{ url: string; date: string; score: number }>): ResearchContext {
  return {
    topic: "test", questions: [], stage: "search",
    searchResults: results.map(r => ({
      url: r.url, title: "Test", snippet: "", source: "web", timestamp: r.date, relevanceScore: r.score,
    })),
    extractions: [],
  };
}

describe("SourceCredibilityGate", () => {
  const gate = new SourceCredibilityGate();

  it("should have correct name and stage", () => {
    expect(gate.name).toBe("source-credibility");
    expect(gate.stage).toBe("search");
  });

  it("should pass for high-credibility sources", async () => {
    const ctx = makeCtx([
      { url: "https://arxiv.org/papers/ai-safety", date: new Date().toISOString(), score: 0.95 },
      { url: "https://nature.com/article/science", date: new Date().toISOString(), score: 0.9 },
    ]);
    const result = await gate.check(ctx);
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0.7);
  });

  it("should fail for low-credibility sources", async () => {
    const ctx = makeCtx([
      { url: "https://random-blog.com/ai", date: "2020-01-01", score: 0.3 },
    ]);
    const result = await gate.check(ctx);
    expect(result.passed).toBe(false);
  });

  it("should score arxiv highly", async () => {
    const ctx = makeCtx([
      { url: "https://arxiv.org/abs/2401.00001", date: new Date().toISOString(), score: 1.0 },
    ]);
    const result = await gate.check(ctx);
    const detail = result.details[0];
    expect(detail.score).toBeGreaterThan(0.8);
    expect(detail.reason).toContain("High");
  });

  it("should penalize old sources", async () => {
    const ctx = makeCtx([
      { url: "https://arxiv.org/old", date: "2018-01-01", score: 1.0 },
    ]);
    const result = await gate.check(ctx);
    expect(result.details[0].score).toBeLessThan(0.9);
  });

  it("should include recommendations field in result", async () => {
    const ctx = makeCtx([
      { url: "https://random-forum.com/post", date: "2018-01-01", score: 0.1 },
    ]);
    const result = await gate.check(ctx);
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it("should handle empty search results", async () => {
    const ctx = makeCtx([]);
    const result = await gate.check(ctx);
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
  });

  it("should output correct result structure", async () => {
    const ctx = makeCtx([
      { url: "https://ieee.org/paper", date: new Date().toISOString(), score: 0.9 },
    ]);
    const result = await gate.check(ctx);
    expect(result).toHaveProperty("passed");
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("threshold");
    expect(result).toHaveProperty("details");
  });
});
