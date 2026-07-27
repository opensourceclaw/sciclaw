import { describe, it, expect } from "vitest";
import { observeStage, applyObserve } from "../../src/stages/observe.js";
import type { ResearchContext } from "../../src/context/ResearchContext.js";

describe("observeStage", () => {
  it("should extract topic from input", async () => {
    const result = await observeStage("AI safety research is important. We need alignment.");
    expect(result.topic).toBeDefined();
    expect(result.topic.length).toBeGreaterThan(0);
  });

  it("should generate questions about the topic", async () => {
    const result = await observeStage("Quantum computing");
    expect(result.questions.length).toBeGreaterThan(0);
    expect(result.questions[0]).toContain("Quantum computing");
    expect(result.questions.length).toBeLessThanOrEqual(5);
  });

  it("should include key question types", async () => {
    const result = await observeStage("Climate change");
    const qs = result.questions.join(" ").toLowerCase();
    expect(qs).toContain("what is");
    expect(qs).toContain("latest");
    expect(qs).toContain("challenges");
    expect(qs).toContain("future trends");
  });

  it("should define scope", async () => {
    const result = await observeStage("Blockchain technology");
    expect(result.scope).toContain("Blockchain technology");
    expect(result.scope).toContain("Research scope:");
  });

  it("should handle single-sentence input", async () => {
    const result = await observeStage("Hello world");
    expect(result.topic).toBe("Hello world");
    expect(result.questions.length).toBeGreaterThan(0);
  });

  it("should apply observe result to context", () => {
    const ctx: ResearchContext = {
      topic: "", questions: [], searchResults: [], extractions: [], stage: "observe",
    };
    const result = { topic: "AI Safety", questions: ["Q1"], scope: "Research scope: AI Safety" };
    const updated = applyObserve(ctx, result);
    expect(updated.topic).toBe("AI Safety");
    expect(updated.questions).toEqual(["Q1"]);
    expect(updated.stage).toBe("plan");
  });
});
