import { describe, it, expect, beforeEach } from "vitest";
import { ResearchStateMachine } from "../../src/orchestrator/research-state-machine.js";

function makeContext() {
  return {
    topic: "AI safety research",
    questions: ["What is alignment?"],
    stage: "observe" as const,
  };
}

describe("ResearchStateMachine", () => {
  let sm: ResearchStateMachine;

  beforeEach(() => {
    sm = new ResearchStateMachine(makeContext());
  });

  it("should start at observe stage", () => {
    expect(sm.getStage()).toBe("observe");
  });

  it("should have 7 stages", () => {
    expect(sm.getAllStages().length).toBe(7);
  });

  it("should have observe as first stage", () => {
    expect(sm.getAllStages()[0]).toBe("observe");
  });

  it("should have report as last stage", () => {
    const stages = sm.getAllStages();
    expect(stages[stages.length - 1]).toBe("report");
  });

  it("should transition to next stage", async () => {
    const result = await sm.transition();
    expect(result.success).toBe(true);
  });

  it("should update context", () => {
    sm.updateContext({ topic: "Updated topic" });
    expect(sm.getContext().topic).toBe("Updated topic");
  });

  it("should track gate results", () => {
    const results = sm.getGateResults();
    expect(results instanceof Map).toBe(true);
  });

  it("should reset to observe", () => {
    sm.updateContext({ stage: "search" });
    sm.reset();
    expect(sm.getStage()).toBe("observe");
    expect(sm.getGateResults().size).toBe(0);
  });

  it("should get remaining stages", () => {
    const remaining = sm.getRemainingStages();
    expect(remaining.length).toBeGreaterThan(0);
    expect(remaining[0]).toBe("observe");
  });

  it("should report progress", () => {
    const progress = sm.getProgress();
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(1);
  });
});
