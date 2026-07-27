import { describe, it, expect } from "vitest";
import { ResearchGateRegistry, researchGateRegistry } from "../../../src/gate/research/research-gate-registry.js";
import type { ResearchContext } from "../../../src/context/ResearchContext.js";

function makeCtx(): ResearchContext {
  return {
    topic: "test", questions: [], stage: "search",
    searchResults: [
      { url: "https://arxiv.org/test", title: "Test", snippet: "", source: "web", timestamp: new Date().toISOString(), relevanceScore: 0.95 },
    ],
    extractions: [],
    synthesis: {
      summary: "test", arguments: [
        { claim: "test claim here with evidence", evidence: ["s1"], counterArguments: ["counter"] },
      ], conclusions: ["c1"],
      citations: [
        { id: "c1", source: "Test Source", url: "https://arxiv.org/test", accessedAt: new Date().toISOString() },
      ],
    },
  };
}

describe("ResearchGateRegistry", () => {
  it("should register default gates", () => {
    const registry = new ResearchGateRegistry();
    const all = registry.getAll();
    expect(all.length).toBe(4);
  });

  it("should get gate by name", () => {
    const registry = new ResearchGateRegistry();
    const gate = registry.get("source-credibility");
    expect(gate).toBeDefined();
    expect(gate!.name).toBe("source-credibility");
  });

  it("should return undefined for unknown gate", () => {
    const registry = new ResearchGateRegistry();
    expect(registry.get("unknown")).toBeUndefined();
  });

  it("should get gates by stage", () => {
    const registry = new ResearchGateRegistry();
    const searchGates = registry.getByStage("search");
    expect(searchGates.length).toBe(1);
    expect(searchGates[0].name).toBe("source-credibility");
  });

  it("should run all gates", async () => {
    const registry = new ResearchGateRegistry();
    const ctx = makeCtx();
    const results = await registry.runAll(ctx);
    expect(results.size).toBe(4);
    expect(results.has("source-credibility")).toBe(true);
    expect(results.has("cross-validation")).toBe(true);
    expect(results.has("bias-detection")).toBe(true);
    expect(results.has("citation-integrity")).toBe(true);
  });

  it("should run gates for specific stage", async () => {
    const registry = new ResearchGateRegistry();
    const ctx = makeCtx();
    const results = await registry.runForStage("search", ctx);
    expect(results.size).toBe(1);
    expect(results.has("source-credibility")).toBe(true);
  });

  it("should use singleton instance", () => {
    expect(researchGateRegistry).toBeDefined();
    expect(researchGateRegistry.getAll().length).toBe(4);
  });
});
