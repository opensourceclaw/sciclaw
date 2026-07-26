import { describe, it, expect, beforeEach } from "vitest";
import { DeepResearchFlow } from "../../src/flows/deep_research_flow.js";
import type { DeepResearchConfig, ResearchStage } from "../../src/flows/deep_research_flow.js";

describe("DeepResearchFlow", () => {
  let flow: DeepResearchFlow;

  beforeEach(() => {
    flow = new DeepResearchFlow();
  });

  it("should initialize with default config", () => {
    expect(flow.getCurrentStage()).toBe("plan");
    expect(flow.getProgress()).toBe(0.2);
    expect(flow.isPaused()).toBe(false);
  });

  it("should start research with valid topic", async () => {
    const ctx = await flow.start("TypeScript testing");
    expect(ctx.originalQuery).toBe("TypeScript testing");
    expect(ctx.sessionId).toMatch(/^deep-/);
    expect(ctx.maxIterations).toBe(5);
  });

  it("should progress through plan stage", async () => {
    await flow.start("AI safety");
    const plan = await flow.plan();

    expect(plan.strategy).toBe("depth-first");
    expect(plan.subQueries.length).toBe(3);
    expect(flow.getCurrentStage()).toBe("plan");
    expect(flow.getProgress()).toBe(0.2);
  });

  it("should progress through all stages", async () => {
    await flow.start("test");
    await flow.plan();
    expect(flow.getCurrentStage()).toBe("plan");

    await flow.search();
    expect(flow.getCurrentStage()).toBe("search");

    await flow.analyze();
    const analysis = await flow.analyze();
    expect(analysis.confidence).toBe(0.75);
    expect(analysis.blindSpots.length).toBe(2);
    expect(flow.getCurrentStage()).toBe("analyze");

    await flow.synthesize();
    const synthesis = await flow.synthesize();
    expect(synthesis.keyInsights.length).toBe(3);
    expect(flow.getCurrentStage()).toBe("synthesize");

    await flow.report();
    const report = await flow.report();
    expect(report.sections.length).toBe(4);
    expect(report.title).toContain("test");
    expect(flow.getProgress()).toBe(1);
  });

  it("should handle approval rejection", async () => {
    const strictFlow = new DeepResearchFlow(async () => false);
    await strictFlow.start("test");

    await expect(strictFlow.plan()).rejects.toThrow("Approval denied");
  });

  it("should support pause and resume", async () => {
    await flow.start("test");
    expect(flow.isPaused()).toBe(false);

    flow.pause();
    expect(flow.isPaused()).toBe(true);

    flow.resume();
    expect(flow.isPaused()).toBe(false);
  });

  it("should track execution time", async () => {
    await flow.start("test");
    await flow.plan();
    await flow.search();
    await flow.analyze();
    await flow.synthesize();
    await flow.report();

    const durations = flow.getStageDurations();
    const stages: ResearchStage[] = ["plan", "search", "analyze", "synthesize", "report"];
    for (const stage of stages) {
      expect(durations[stage]).toBeGreaterThanOrEqual(0);
    }
  });

  it("should support custom config", async () => {
    const config: DeepResearchConfig = { maxDepth: 3, timeout: 60000, approvalRequired: false };
    const customFlow = new DeepResearchFlow(undefined, config);

    await customFlow.start("test");
    // Should not throw (approval not required)
    const plan = await customFlow.plan();
    expect(plan.estimatedDepth).toBe(3);
  });

  it("should report correct progress at each stage", async () => {
    await flow.start("test");
    expect(flow.getProgress()).toBeGreaterThan(0);

    await flow.plan();
    await flow.search();
    await flow.analyze();
    await flow.synthesize();
    await flow.report();

    expect(flow.getProgress()).toBe(1);
  });
});
