import { describe, it, expect } from "vitest";
import { DeepResearchFlow } from "../../src/flows/deep_research_flow.js";

describe("DeepResearchFlow — Stages Integration", () => {
  it("should init state machine", () => {
    const flow = new DeepResearchFlow();
    const sm = flow.initStateMachine({ topic: "AI Safety" });
    expect(sm).toBeDefined();
    expect(flow.getCurrentStageFromMachine()).toBe("observe");
  });

  it("should run observe stage", async () => {
    const flow = new DeepResearchFlow();
    flow.initStateMachine();
    await flow.runObserve("AI safety research");
    const stage = flow.getCurrentStageFromMachine();
    expect(stage).toBe("observe");
  });

  it("should get gate results initially empty", () => {
    const flow = new DeepResearchFlow();
    flow.initStateMachine();
    expect(flow.getGateResults().size).toBe(0);
  });

  it("should throw for validate without init", async () => {
    const flow = new DeepResearchFlow();
    await expect(flow.runValidate()).rejects.toThrow("State machine not initialized");
  });

  it("should run validate after init", async () => {
    const flow = new DeepResearchFlow(undefined, { approvalRequired: false });
    flow.initStateMachine({
      topic: "test",
      questions: [],
      stage: "validate" as any,
    });
    const result = await flow.runValidate();
    expect(result).toBeDefined();
    expect(typeof result.isValid).toBe("boolean");
  });

  it("should auto-init stateMachine on runObserve", async () => {
    const flow = new DeepResearchFlow();
    await flow.runObserve("test");
    expect(flow.getCurrentStageFromMachine()).toBe("observe");
  });
});
