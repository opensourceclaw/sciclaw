import { describe, it, expect, beforeEach } from "vitest";
import { DeepResearchFlow } from "../../src/flows/deep_research_flow.js";
import { AutoResearchFlow } from "../../src/flows/auto_research_flow.js";
import { registerFixtureSearch } from "../helpers/fixture-search.js";

describe("CLI Mode Flag", () => {
  beforeEach(() => {
    registerFixtureSearch();
  });

  it("should create DeepResearchFlow for deep mode", () => {
    const flow = new DeepResearchFlow();
    expect(flow.getCurrentStage()).toBe("plan");
  });

  it("should create AutoResearchFlow for auto mode", () => {
    const flow = new AutoResearchFlow();
    expect(flow.getCurrentStage()).toBe("plan");
  });

  it("should use different strategies for each mode", async () => {
    const deepFlow = new DeepResearchFlow(undefined, { approvalRequired: false });
    await deepFlow.start("test");
    const deepPlan = await deepFlow.plan();
    expect(deepPlan.strategy).toBe("depth-first");

    const autoFlow = new AutoResearchFlow();
    await autoFlow.start("test");
    const autoPlan = await autoFlow.plan();
    expect(autoPlan.strategy).toBe("breadth-first");
  });

  it("should run auto flow to completion", async () => {
    const autoFlow = new AutoResearchFlow();
    const result = await autoFlow.run("quick test");
    expect(result.conclusion).toContain("quick test");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("should track progress in both modes", async () => {
    const deepFlow = new DeepResearchFlow(undefined, { approvalRequired: false });
    await deepFlow.start("test");
    expect(deepFlow.getProgress()).toBeGreaterThan(0);

    const autoFlow = new AutoResearchFlow();
    await autoFlow.start("test");
    expect(autoFlow.getProgress()).toBeGreaterThan(0);
  });

  it("should support config options", () => {
    const autoFlow = new AutoResearchFlow({ maxDepth: 5, timeout: 60000 });
    expect(autoFlow.getCurrentStage()).toBe("plan");
  });
});
