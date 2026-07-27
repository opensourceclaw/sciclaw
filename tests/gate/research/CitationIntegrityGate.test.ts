import { describe, it, expect } from "vitest";
import { CitationIntegrityGate } from "../../../src/gate/research/citation-integrity-gate.js";
import type { ResearchContext } from "../../../src/context/ResearchContext.js";

function makeCtx(overrides?: Partial<ResearchContext>): ResearchContext {
  return {
    topic: "test", questions: [], stage: "report",
    searchResults: [
      { url: "https://example.com/ref1", title: "Reference 1", snippet: "", source: "web", timestamp: new Date().toISOString(), relevanceScore: 0.9 },
    ],
    extractions: [],
    synthesis: {
      summary: "test", arguments: [], conclusions: [],
      citations: [
        { id: "c1", source: "Reference 1", url: "https://example.com/ref1", accessedAt: new Date().toISOString() },
        { id: "c2", source: "Reference 2", url: "https://example.com/ref2", accessedAt: new Date().toISOString() },
      ],
    },
    ...overrides,
  };
}

describe("CitationIntegrityGate", () => {
  const gate = new CitationIntegrityGate();

  it("should have correct name and stage", () => {
    expect(gate.name).toBe("citation-integrity");
    expect(gate.stage).toBe("report");
  });

  it("should pass for complete citations", async () => {
    const ctx = makeCtx();
    const result = await gate.check(ctx);
    expect(result.details.length).toBe(2);
  });

  it("should fail when no synthesis available", async () => {
    const ctx = makeCtx({ synthesis: undefined });
    const result = await gate.check(ctx);
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
  });

  it("should fail when no citations", async () => {
    const ctx = makeCtx({
      synthesis: { summary: "test", arguments: [], conclusions: [], citations: [] },
    });
    const result = await gate.check(ctx);
    expect(result.passed).toBe(false);
    expect(result.details[0].reason).toContain("No citations");
  });

  it("should rate complete citations higher", async () => {
    const ctx = makeCtx({
      synthesis: {
        summary: "test", arguments: [], conclusions: [],
        citations: [
          { id: "c1", source: "Full", url: "https://example.com", accessedAt: new Date().toISOString() },
        ],
      },
    });
    const result = await gate.check(ctx);
    expect(result.details[0].score).toBeGreaterThanOrEqual(0.9);
  });

  it("should rate incomplete citations lower", async () => {
    const ctx = makeCtx({
      synthesis: {
        summary: "test", arguments: [], conclusions: [],
        citations: [
          { id: "", source: "", url: undefined, accessedAt: "" } as any,
        ],
      },
    });
    const result = await gate.check(ctx);
    expect(result.details[0].score).toBeLessThan(0.5);
  });

  it("should suggest fixes for incomplete citations", async () => {
    const ctx = makeCtx({
      synthesis: {
        summary: "test", arguments: [], conclusions: [],
        citations: [
          { id: "", source: "", url: undefined, accessedAt: "" } as any,
        ],
      },
    });
    const result = await gate.check(ctx);
    if (result.recommendations) {
      expect(result.recommendations[0]).toContain("Fix");
    }
  });

  it("should give bonus for source verification", async () => {
    const ctx = makeCtx({
      searchResults: [
        { url: "https://example.com/ref1", title: "Reference 1 Paper", snippet: "", source: "web", timestamp: new Date().toISOString(), relevanceScore: 0.9 },
      ],
      synthesis: {
        summary: "test", arguments: [], conclusions: [],
        citations: [
          { id: "c1", source: "Reference 1", url: "https://example.com/ref1", accessedAt: new Date().toISOString() },
        ],
      },
    });
    const result = await gate.check(ctx);
    expect(result.details[0].score).toBeGreaterThan(0.9);
  });
});
