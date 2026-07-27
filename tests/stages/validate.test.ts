import { describe, it, expect } from "vitest";
import { validateStage } from "../../src/stages/validate.js";
import type { ResearchContext } from "../../src/context/ResearchContext.js";

function makeCtx(overrides?: Partial<ResearchContext>): ResearchContext {
  return {
    topic: "test", questions: [], stage: "validate",
    searchResults: [
      { url: "https://arxiv.org/1", title: "Paper 1", snippet: "AI alignment", source: "web", timestamp: new Date().toISOString(), relevanceScore: 0.9 },
      { url: "https://arxiv.org/2", title: "Paper 2", snippet: "Safety methods", source: "web", timestamp: new Date().toISOString(), relevanceScore: 0.85 },
      { url: "https://arxiv.org/3", title: "Paper 3", snippet: "Alignment debate", source: "web", timestamp: new Date().toISOString(), relevanceScore: 0.8 },
    ],
    extractions: [],
    synthesis: {
      summary: "test", arguments: [
        { claim: "AI alignment is important for safety research", evidence: ["s1"], counterArguments: ["counter"] },
      ], conclusions: ["c1"],
      citations: [
        { id: "c1", source: "Test", url: "https://arxiv.org/1", accessedAt: new Date().toISOString() },
      ],
    },
    ...overrides,
  };
}

describe("validateStage", () => {
  it("should return validation result with bias report", async () => {
    const ctx = makeCtx();
    const result = await validateStage(ctx);
    expect(result.biasReport).toBeDefined();
    expect(result.biasReport.overall).toBeGreaterThanOrEqual(0);
    expect(result.biasReport.selectionBias).toBeGreaterThanOrEqual(0);
    expect(result.biasReport.confirmationBias).toBeGreaterThanOrEqual(0);
    expect(result.biasReport.temporalBias).toBeGreaterThanOrEqual(0);
  });

  it("should return cross validation result", async () => {
    const ctx = makeCtx();
    const result = await validateStage(ctx);
    expect(result.crossValidation).toBeDefined();
    expect(typeof result.crossValidation.claimsWithSupport).toBe("number");
    expect(typeof result.crossValidation.claimsWithoutSupport).toBe("number");
    expect(typeof result.crossValidation.overallAgreement).toBe("number");
  });

  it("should report isValid status", async () => {
    const ctx = makeCtx();
    const result = await validateStage(ctx);
    expect(typeof result.isValid).toBe("boolean");
  });

  it("should generate recommendations", async () => {
    const ctx = makeCtx();
    const result = await validateStage(ctx);
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it("should work with minimal context", async () => {
    const ctx: ResearchContext = {
      topic: "test", questions: [], searchResults: [], extractions: [], stage: "validate",
    };
    const result = await validateStage(ctx);
    expect(result).toBeDefined();
    expect(result.biasReport).toBeDefined();
  });

  it("should work with context having synthesis", async () => {
    const ctx = makeCtx();
    const result = await validateStage(ctx);
    expect(result.crossValidation.claimsWithSupport).toBeGreaterThanOrEqual(0);
  });

  it("should run bias detection on diverse sources", async () => {
    const ctx = makeCtx({
      searchResults: [
        { url: "https://source-a.com", title: "A", snippet: "", source: "web", timestamp: "2020-01-01", relevanceScore: 0.5 },
        { url: "https://source-b.org", title: "B", snippet: "", source: "web", timestamp: "2024-01-01", relevanceScore: 0.5 },
      ],
    });
    const result = await validateStage(ctx);
    expect(result.biasReport.selectionBias).toBeGreaterThanOrEqual(0);
  });

  it("should handle zero search results", async () => {
    const ctx = makeCtx({ searchResults: [] });
    const result = await validateStage(ctx);
    expect(result).toBeDefined();
  });
});
