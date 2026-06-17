import { describe, it, expect } from "vitest";
import {
  ReasoningChainManager,
  createReasoningChainManager,
} from "../../src/reasoning/chain.js";
import { ReasoningStepType } from "../../src/reasoning/types.js";

function makeStep(overrides: Partial<{
  type: ReasoningStepType;
  statement: string;
  evidence: string[];
  confidence: number;
  dependsOn: string[];
}> = {}) {
  return {
    type: overrides.type ?? ReasoningStepType.OBSERVATION,
    statement: overrides.statement ?? "Test step",
    evidence: overrides.evidence ?? [],
    confidence: overrides.confidence ?? 0.5,
    dependsOn: overrides.dependsOn ?? [],
    alternatives: [],
  };
}

describe("ReasoningChainManager", () => {
  let mgr: ReasoningChainManager;

  beforeEach(() => {
    mgr = createReasoningChainManager();
  });

  describe("createChain", () => {
    it("creates chain with topic and goal", () => {
      const chain = mgr.createChain("AI Safety", "Determine risks");
      expect(chain.topic).toBe("AI Safety");
      expect(chain.goal).toBe("Determine risks");
    });

    it("creates chain with unique ID", () => {
      const c1 = mgr.createChain("A", "B");
      const c2 = mgr.createChain("A", "B");
      expect(c1.id).not.toBe(c2.id);
    });

    it("initializes with empty steps", () => {
      const chain = mgr.createChain("Topic", "Goal");
      expect(chain.steps).toEqual([]);
    });
  });

  describe("addStep", () => {
    it("adds observation step", () => {
      let chain = mgr.createChain("Topic", "Goal");
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.OBSERVATION, statement: "Observed X" }));
      expect(chain.steps).toHaveLength(1);
      expect(chain.steps[0]!.type).toBe(ReasoningStepType.OBSERVATION);
    });

    it("adds hypothesis step", () => {
      let chain = mgr.createChain("Topic", "Goal");
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.HYPOTHESIS, statement: "Maybe Y" }));
      expect(chain.steps[0]!.type).toBe(ReasoningStepType.HYPOTHESIS);
    });

    it("adds inference step", () => {
      let chain = mgr.createChain("Topic", "Goal");
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.INFERENCE }));
      expect(chain.steps[0]!.type).toBe(ReasoningStepType.INFERENCE);
    });

    it("adds validation step", () => {
      let chain = mgr.createChain("Topic", "Goal");
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.VALIDATION }));
      expect(chain.steps[0]!.type).toBe(ReasoningStepType.VALIDATION);
    });

    it("adds conclusion step", () => {
      let chain = mgr.createChain("Topic", "Goal");
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.CONCLUSION }));
      expect(chain.steps[0]!.type).toBe(ReasoningStepType.CONCLUSION);
    });

    it("generates unique step IDs", () => {
      let chain = mgr.createChain("Topic", "Goal");
      chain = mgr.addStep(chain, makeStep());
      chain = mgr.addStep(chain, makeStep());
      expect(chain.steps[0]!.id).not.toBe(chain.steps[1]!.id);
    });

    it("rejects step beyond maxSteps", () => {
      const tinyMgr = createReasoningChainManager({ maxSteps: 3 });
      let chain = tinyMgr.createChain("T", "G");
      chain = tinyMgr.addStep(chain, makeStep());
      chain = tinyMgr.addStep(chain, makeStep());
      chain = tinyMgr.addStep(chain, makeStep());
      expect(() => tinyMgr.addStep(chain, makeStep())).toThrow("Max steps");
    });
  });

  describe("validateChain", () => {
    it("validates chain with >=5 steps", () => {
      let chain = mgr.createChain("Topic", "Goal");
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.OBSERVATION, statement: "O1" }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.HYPOTHESIS, statement: "H1" }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.INFERENCE, statement: "I1" }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.VALIDATION, statement: "V1" }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.CONCLUSION, statement: "C1" }));
      const result = mgr.validateChain(chain);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects chain with <5 steps", () => {
      let chain = mgr.createChain("Topic", "Goal");
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.OBSERVATION }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.CONCLUSION }));
      const result = mgr.validateChain(chain);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("at least 5 steps"))).toBe(true);
    });

    it("rejects chain without OBSERVATION", () => {
      let chain = mgr.createChain("Topic", "Goal");
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.HYPOTHESIS }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.INFERENCE }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.INFERENCE }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.VALIDATION }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.CONCLUSION }));
      const result = mgr.validateChain(chain);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("OBSERVATION"))).toBe(true);
    });

    it("rejects chain without CONCLUSION", () => {
      let chain = mgr.createChain("Topic", "Goal");
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.OBSERVATION }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.OBSERVATION }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.HYPOTHESIS }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.INFERENCE }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.VALIDATION }));
      const result = mgr.validateChain(chain);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("CONCLUSION"))).toBe(true);
    });

    it("rejects chain with CONCLUSION not last", () => {
      let chain = mgr.createChain("Topic", "Goal");
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.OBSERVATION }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.CONCLUSION, statement: "C" }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.HYPOTHESIS }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.INFERENCE }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.VALIDATION }));
      const result = mgr.validateChain(chain);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Last step"))).toBe(true);
    });

    it("rejects chain with circular deps", () => {
      let chain = mgr.createChain("Topic", "Goal");
      const s1 = makeStep({ type: ReasoningStepType.OBSERVATION });
      chain = mgr.addStep(chain, s1);
      const s2 = makeStep({ type: ReasoningStepType.HYPOTHESIS, dependsOn: [chain.steps[0]!.id] });
      chain = mgr.addStep(chain, s2);
      const s3 = makeStep({ type: ReasoningStepType.INFERENCE, dependsOn: [chain.steps[1]!.id] });
      chain = mgr.addStep(chain, s3);
      const s4 = makeStep({ type: ReasoningStepType.VALIDATION, dependsOn: [chain.steps[2]!.id] });
      chain = mgr.addStep(chain, s4);
      // Create cycle: s5 depends on s3, and we update s3 to depend on s5
      const s5 = makeStep({ type: ReasoningStepType.CONCLUSION, dependsOn: [chain.steps[2]!.id] });
      chain = mgr.addStep(chain, s5);
      // Now manually inject a cycle by updating an earlier step
      chain.steps[2] = {
        ...chain.steps[2]!,
        dependsOn: [chain.steps[4]!.id], // depends on conclusion (circular)
      };
      const result = mgr.validateChain(chain);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("circular"))).toBe(true);
    });

    it("rejects unknown dependsOn reference", () => {
      let chain = mgr.createChain("Topic", "Goal");
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.OBSERVATION, dependsOn: ["nonexistent-id"] }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.HYPOTHESIS }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.INFERENCE }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.VALIDATION }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.CONCLUSION }));
      const result = mgr.validateChain(chain);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("unknown step"))).toBe(true);
    });
  });

  describe("executeChain", () => {
    it("executes valid chain and returns InferenceResult", () => {
      let chain = mgr.createChain("AI Safety", "Assess risk");
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.OBSERVATION, statement: "AI systems are becoming more capable", evidence: ["e1", "e2"] }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.HYPOTHESIS, statement: "Risk is increasing", dependsOn: [chain.steps[0]!.id] }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.INFERENCE, statement: "Safety measures needed", evidence: ["e3"], dependsOn: [chain.steps[1]!.id] }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.VALIDATION, statement: "Measures are effective", evidence: ["e4"], dependsOn: [chain.steps[2]!.id] }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.CONCLUSION, statement: "Implement safety protocols", dependsOn: [chain.steps[3]!.id] }));

      const result = mgr.executeChain(chain, {});
      expect(result.chainId).toBe(chain.id);
      expect(result.conclusion).toBe("Implement safety protocols");
      expect(result.steps).toHaveLength(5);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it("computes confidence from evidence", () => {
      let chain = mgr.createChain("T", "G");
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.OBSERVATION, statement: "O", evidence: ["e1", "e2", "e3", "e4"] }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.HYPOTHESIS, statement: "H", dependsOn: [chain.steps[0]!.id] }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.INFERENCE, statement: "I", dependsOn: [chain.steps[1]!.id] }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.VALIDATION, statement: "V", dependsOn: [chain.steps[2]!.id] }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.CONCLUSION, statement: "C", dependsOn: [chain.steps[3]!.id] }));

      const result = mgr.executeChain(chain, {});
      // First step has 4 evidence → 0.6 evidence score, no deps → confidence = max(0.6, 0.3) = 0.6
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("returns alternative conclusions from HYPOTHESIS steps", () => {
      let chain = mgr.createChain("T", "G");
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.OBSERVATION, statement: "O" }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.HYPOTHESIS, statement: "Alt conclusion 1", dependsOn: [chain.steps[0]!.id] }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.HYPOTHESIS, statement: "Alt conclusion 2", dependsOn: [chain.steps[0]!.id] }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.INFERENCE, statement: "I", dependsOn: [chain.steps[1]!.id] }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.CONCLUSION, statement: "Main conclusion", dependsOn: [chain.steps[3]!.id] }));

      const result = mgr.executeChain(chain, {});
      expect(result.alternativeConclusions).toContain("Alt conclusion 1");
      expect(result.alternativeConclusions).toContain("Alt conclusion 2");
    });

    it("handles empty chain gracefully (returns confidence 0)", () => {
      const chain = mgr.createChain("T", "G");
      const result = mgr.executeChain(chain, {});
      expect(result.confidence).toBe(0);
      expect(result.conclusion).toBe("");
    });

    it("respects topological order for dependencies", () => {
      let chain = mgr.createChain("T", "G");
      // Add OBSERVATION first (no deps)
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.OBSERVATION, statement: "O" }));
      const obsId = chain.steps[0]!.id;
      // Add remaining steps with deps pointing to OBSERVATION, but add CONCLUSION last
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.HYPOTHESIS, statement: "H", dependsOn: [obsId] }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.INFERENCE, statement: "I", dependsOn: [chain.steps[1]!.id] }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.VALIDATION, statement: "V", dependsOn: [chain.steps[2]!.id] }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.CONCLUSION, statement: "C", dependsOn: [chain.steps[3]!.id] }));

      const result = mgr.executeChain(chain, {});
      // Topological sort should place OBSERVATION first
      expect(result.steps[0]!.type).toBe(ReasoningStepType.OBSERVATION);
      // CONCLUSION should be last
      expect(result.steps[result.steps.length - 1]!.type).toBe(ReasoningStepType.CONCLUSION);
    });
  });

  describe("utilities", () => {
    it("getStepCount returns correct count", () => {
      let chain = mgr.createChain("T", "G");
      chain = mgr.addStep(chain, makeStep());
      chain = mgr.addStep(chain, makeStep());
      expect(mgr.getStepCount(chain)).toBe(2);
    });

    it("getAverageConfidence computes correctly", () => {
      let chain = mgr.createChain("T", "G");
      chain = mgr.addStep(chain, makeStep({ confidence: 0.8 }));
      chain = mgr.addStep(chain, makeStep({ confidence: 0.4 }));
      expect(mgr.getAverageConfidence(chain)).toBe(0.6);
    });

    it("getAverageConfidence returns 0 for empty chain", () => {
      const chain = mgr.createChain("T", "G");
      expect(mgr.getAverageConfidence(chain)).toBe(0);
    });

    it("getChainSummary returns formatted string", () => {
      let chain = mgr.createChain("AI", "Understand");
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.OBSERVATION, statement: "Step 1" }));
      const summary = mgr.getChainSummary(chain);
      expect(summary).toContain("AI");
      expect(summary).toContain("Understand");
      expect(summary).toContain("observation");
    });

    it("exportChain returns steps array", () => {
      let chain = mgr.createChain("T", "G");
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.OBSERVATION }));
      chain = mgr.addStep(chain, makeStep({ type: ReasoningStepType.CONCLUSION }));
      const exported = mgr.exportChain(chain);
      expect(exported).toHaveLength(2);
      expect(exported[0]!.type).toBe(ReasoningStepType.OBSERVATION);
    });
  });

  describe("config", () => {
    it("clamps maxSteps to at least 3", () => {
      const m = createReasoningChainManager({ maxSteps: 1 });
      const chain = m.createChain("T", "G");
      expect(chain.maxSteps).toBe(3);
    });

    it("clamps maxSteps to at most 20", () => {
      const m = createReasoningChainManager({ maxSteps: 100 });
      const chain = m.createChain("T", "G");
      expect(chain.maxSteps).toBe(20);
    });
  });
});
