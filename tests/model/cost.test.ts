import { describe, it, expect } from "vitest";
import { CostOptimizer } from "../../src/model/cost.js";

describe("CostOptimizer", () => {
  it("estimates cost for known model", () => {
    const co = new CostOptimizer();
    const cost = co.estimate("anthropic/claude-sonnet-4-6", 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(18, 0); // 3 + 15 = 18
  });

  it("returns 0 for unknown model", () => {
    const co = new CostOptimizer();
    expect(co.estimate("unknown/model", 1000, 1000)).toBe(0);
  });

  it("isWithinBudget returns true when no budget set", () => {
    const co = new CostOptimizer();
    expect(co.isWithinBudget("anthropic/claude-opus-4-6", 100_000)).toBe(true);
  });

  it("isWithinBudget returns false when over budget", () => {
    const co = new CostOptimizer(0.01); // $0.01 budget
    expect(co.isWithinBudget("anthropic/claude-opus-4-6", 1_000_000)).toBe(false);
  });

  it("recommends cheapest model for summarization", () => {
    const co = new CostOptimizer();
    expect(co.recommendCheapest("summarization", 1000)).toBe("google/gemini-3-flash-preview");
  });

  it("recommends cheapest model for coding", () => {
    const co = new CostOptimizer();
    expect(co.recommendCheapest("coding", 1000)).toBe("deepseek/deepseek-v4-flash");
  });

  it("returns fallback when no model fits budget", () => {
    const co = new CostOptimizer(0.00001); // impossibly small budget
    const model = co.recommendCheapest("default", 1000);
    // Falls back to the hardcoded cheapest
    expect(model).toBe("deepseek/deepseek-v4-flash");
  });

  it("getModelCosts returns copy of costs", () => {
    const co = new CostOptimizer();
    const costs = co.getModelCosts();
    expect(costs["anthropic/claude-sonnet-4-6"]).toBeDefined();
    expect(costs["google/gemini-3-flash-preview"]).toBeDefined();
  });
});
