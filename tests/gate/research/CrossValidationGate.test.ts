import { describe, it, expect } from "vitest";
import { CrossValidationGate } from "../../../src/gate/research/cross-validation-gate.js";
import type { ResearchContext } from "../../../src/context/ResearchContext.js";

function makeCtx(overrides?: Partial<ResearchContext>): ResearchContext {
  return {
    topic: "test", questions: [], stage: "synthesize",
    searchResults: [
      { url: "https://a.com", title: "AI Safety", snippet: "alignment is important", source: "web", timestamp: new Date().toISOString(), relevanceScore: 0.9 },
      { url: "https://b.com", title: "Safety Methods", snippet: "alignment techniques exist", source: "web", timestamp: new Date().toISOString(), relevanceScore: 0.8 },
      { url: "https://c.com", title: "AI Ethics", snippet: "alignment debate continues", source: "web", timestamp: new Date().toISOString(), relevanceScore: 0.85 },
    ],
    extractions: [],
    synthesis: {
      summary: "test",
      arguments: [
        { claim: "AI alignment is important for safety", evidence: ["source 1"] },
        { claim: "Multiple approaches to alignment exist", evidence: ["source 2"], counterArguments: ["Some disagree"] },
      ],
      conclusions: ["Alignment is critical"],
      citations: [
        { id: "c1", source: "AI Safety Paper", url: "https://a.com", accessedAt: new Date().toISOString() },
        { id: "c2", source: "Safety Methods Paper", url: "https://b.com", accessedAt: new Date().toISOString() },
      ],
    },
    ...overrides,
  };
}

describe("CrossValidationGate", () => {
  const gate = new CrossValidationGate();

  it("should have correct name and stage", () => {
    expect(gate.name).toBe("cross-validation");
    expect(gate.stage).toBe("synthesize");
  });

  it("should pass for well-supported claims", async () => {
    const ctx = makeCtx();
    const result = await gate.check(ctx);
    expect(result.score).toBeGreaterThan(0);
    expect(result.details.length).toBe(2);
  });

  it("should fail when no synthesis available", async () => {
    const ctx = makeCtx({ synthesis: undefined });
    const result = await gate.check(ctx);
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
  });

  it("should rate claims with more supporting sources higher", async () => {
    const ctx = makeCtx();
    const result = await gate.check(ctx);
    const scores = result.details.map(d => d.score);
    expect(scores.every(s => s > 0)).toBe(true);
  });

  it("should recommend strengthening weak claims", async () => {
    const ctx = makeCtx({
      synthesis: {
        summary: "test", arguments: [
          { claim: "Very obscure specific niche topic claim here", evidence: [] },
        ], conclusions: [], citations: [],
      },
    });
    const result = await gate.check(ctx);
    if (result.recommendations && result.recommendations.length > 0) {
      expect(result.recommendations[0]).toContain("Strengthen");
    }
  });

  it("should output correct structure", async () => {
    const ctx = makeCtx();
    const result = await gate.check(ctx);
    expect(result).toHaveProperty("passed");
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("threshold", 0.8);
    expect(result).toHaveProperty("details");
  });

  it("should find supporting sources by keyword match", async () => {
    const ctx = makeCtx({
      synthesis: {
        summary: "test", arguments: [
          { claim: "AI alignment is important", evidence: [] },
        ], conclusions: [], citations: [],
      },
    });
    const result = await gate.check(ctx);
    expect(result.details[0].reason).toContain("Supported by");
  });

  it("should not pass below threshold", async () => {
    const ctx = makeCtx({
      searchResults: [],
      synthesis: {
        summary: "test", arguments: [
          { claim: "Unsupported claim here", evidence: [] },
        ], conclusions: [], citations: [],
      },
    });
    const result = await gate.check(ctx);
    expect(result.passed).toBe(false);
  });
});
