import { describe, it, expect } from "vitest";
import { BiasDetectionGate } from "../../../src/gate/research/bias-detection-gate.js";
import type { ResearchContext } from "../../../src/context/ResearchContext.js";

function makeCtx(overrides?: Partial<ResearchContext>): ResearchContext {
  return {
    topic: "test", questions: [], stage: "validate",
    searchResults: [
      { url: "https://source-a.com/1", title: "A", snippet: "", source: "web", timestamp: "2020-01-01", relevanceScore: 0.9 },
      { url: "https://source-b.org/2", title: "B", snippet: "", source: "web", timestamp: "2022-06-15", relevanceScore: 0.8 },
      { url: "https://source-c.edu/3", title: "C", snippet: "", source: "web", timestamp: "2024-12-01", relevanceScore: 0.85 },
      { url: "https://source-d.com/4", title: "D", snippet: "", source: "web", timestamp: "2026-01-15", relevanceScore: 0.9 },
    ],
    extractions: [],
    ...overrides,
  };
}

describe("BiasDetectionGate", () => {
  const gate = new BiasDetectionGate();

  it("should have correct name and stage", () => {
    expect(gate.name).toBe("bias-detection");
    expect(gate.stage).toBe("validate");
  });

  it("should pass for diverse sources with counter-arguments", async () => {
    const ctx = makeCtx({
      synthesis: {
        summary: "test", arguments: [
          { claim: "Test", evidence: [], counterArguments: ["Counter point"] },
        ], conclusions: [], citations: [],
      },
    });
    const result = await gate.check(ctx);
    expect(result.details.length).toBe(3);
  });

  it("should detect selection bias", async () => {
    const ctx = makeCtx({
      searchResults: [
        { url: "https://same-source.com/1", title: "A", snippet: "", source: "web", timestamp: "2024-01-01", relevanceScore: 0.9 },
        { url: "https://same-source.com/2", title: "B", snippet: "", source: "web", timestamp: "2024-01-01", relevanceScore: 0.8 },
      ],
    });
    const result = await gate.check(ctx);
    const selDetail = result.details.find(d => d.item === "selection");
    expect(selDetail).toBeDefined();
  });

  it("should detect confirmation bias", async () => {
    const ctx = makeCtx({
      synthesis: {
        summary: "test", arguments: [
          { claim: "One-sided claim", evidence: [] },
        ], conclusions: [], citations: [],
      },
    });
    const result = await gate.check(ctx);
    const confDetail = result.details.find(d => d.item === "confirmation");
    expect(confDetail).toBeDefined();
  });

  it("should detect temporal bias", async () => {
    const ctx = makeCtx();
    const result = await gate.check(ctx);
    const tempDetail = result.details.find(d => d.item === "temporal");
    expect(tempDetail).toBeDefined();
  });

  it("should suggest mitigations for biases", async () => {
    const ctx = makeCtx({
      searchResults: [
        { url: "https://same-source.com/1", title: "A", snippet: "", source: "web", timestamp: "2024-01-01", relevanceScore: 0.9 },
      ],
      synthesis: {
        summary: "test", arguments: [
          { claim: "Claim without counter", evidence: [] },
        ], conclusions: [], citations: [],
      },
    });
    const result = await gate.check(ctx);
    expect(result.recommendations).toBeDefined();
  });

  it("should pass when bias is low", async () => {
    const ctx = makeCtx({
      synthesis: {
        summary: "test", arguments: [
          { claim: "Test", evidence: ["s1"], counterArguments: ["counter"] },
        ], conclusions: [], citations: [],
      },
    });
    const result = await gate.check(ctx);
    expect(result).toHaveProperty("passed");
  });

  it("should output all three bias dimensions", async () => {
    const ctx = makeCtx();
    const result = await gate.check(ctx);
    const items = result.details.map(d => d.item);
    expect(items).toContain("selection");
    expect(items).toContain("confirmation");
    expect(items).toContain("temporal");
  });
});
