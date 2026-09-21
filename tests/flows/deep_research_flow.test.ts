import { describe, it, expect, beforeEach } from "vitest";
import { DeepResearchFlow } from "../../src/flows/deep_research_flow.js";
import type { DeepResearchConfig, ResearchStage } from "../../src/flows/deep_research_flow.js";
import { registerFixtureSearch, registerFailingSearch } from "../helpers/fixture-search.js";

describe("DeepResearchFlow", () => {
  let flow: DeepResearchFlow;

  beforeEach(() => {
    registerFixtureSearch();
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
    // GA-A4: confidence is the real verifier coverage ratio; no blind-spot engine yet.
    expect(analysis.confidence).toBeGreaterThan(0);
    expect(analysis.blindSpots).toEqual([]);
    expect(flow.getCurrentStage()).toBe("analyze");

    await flow.synthesize();
    const synthesis = await flow.synthesize();
    expect(synthesis.keyInsights.length).toBeGreaterThan(0);
    expect(synthesis.synthesisMode).toBe("extractive");
    expect(synthesis.summary).toContain("test");
    expect(flow.getCurrentStage()).toBe("synthesize");

    await flow.report();
    const report = await flow.report();
    expect(report.title).toContain("test");
    expect(flow.getProgress()).toBe(1);
    // GA-A4: evidence chain replaces the placeholder references.
    expect(report.references.length).toBeGreaterThan(0);
    expect(report.references.every((r) => r.includes("fixture.example"))).toBe(true);
    expect(report.evidence?.gates.length).toBe(4);
    expect(report.blocked).toBe(report.evidence?.gates.some((g) => !g.passed));
    expect(report.sections.some((s) => s.heading === "Evidence Status")).toBe(report.blocked);
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

  describe("real-path wiring (GA-A2)", () => {
    it("populates context.results from the injected search source", async () => {
      await flow.start("fixture topic");
      await flow.plan();
      const sets = await flow.search();

      expect(sets.length).toBeGreaterThan(0);
      const all = sets.flatMap((s) => s.results);
      expect(all.length).toBeGreaterThan(0);
      expect(all.every((r) => r.url.includes("fixture.example"))).toBe(true);
      expect(all.every((r) => r.source === "duckduckgo")).toBe(true);
      expect(all.every((r) => typeof r.rank === "number")).toBe(true);
    });

    it("does not fabricate results when the search source fails", async () => {
      registerFailingSearch();
      await flow.start("failing topic");
      await flow.plan();
      const sets = await flow.search();

      expect(sets.flatMap((s) => s.results).length).toBe(0);
      const synthesis = await flow.synthesize();
      expect(synthesis.summary).toContain("No search results");
      expect(synthesis.keyInsights).toEqual([]);
    });

    it("labels mock mode results and never uses example.com", async () => {
      const mockFlow = new DeepResearchFlow(undefined, { mock: true });
      await mockFlow.start("mock topic");
      await mockFlow.plan();
      const sets = await mockFlow.search();

      const all = sets.flatMap((s) => s.results);
      expect(all.length).toBeGreaterThan(0);
      expect(all.every((r) => r.source === "mock")).toBe(true);
      expect(all.every((r) => r.url.includes("mock.invalid"))).toBe(true);
      expect(all.some((r) => r.url.includes("example.com"))).toBe(false);
    });
  });
});
