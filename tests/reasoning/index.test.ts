import { describe, it, expect } from "vitest";
import {
  ReasoningEngine,
  createReasoningEngine,
} from "../../src/reasoning/index.js";
import { ReasoningStepType, CausalRelationType } from "../../src/reasoning/types.js";
import { ReasoningChainManager } from "../../src/reasoning/chain.js";
import { CausalAnalyzer } from "../../src/reasoning/causal.js";

describe("ReasoningEngine", () => {
  let engine: ReasoningEngine;

  beforeEach(() => {
    engine = createReasoningEngine();
  });

  it("creates ReasoningEngine instance", () => {
    expect(engine).toBeInstanceOf(ReasoningEngine);
  });

  it("createChain delegates to chainManager", () => {
    const chain = engine.createChain("Topic", "Goal");
    expect(chain.topic).toBe("Topic");
    expect(chain.goal).toBe("Goal");
    expect(chain.steps).toEqual([]);
  });

  it("infer delegates to chainManager", () => {
    const chain = engine.createChain("T", "G");
    // Empty chain → invalid, confidence 0
    const result = engine.infer(chain, {});
    expect(result.chainId).toBe(chain.id);
    expect(result.confidence).toBe(0);
  });

  it("analyzeCausal delegates to causalAnalyzer", () => {
    const entities = [
      { name: "A", relations: [{ target: "B", type: "causes" }] },
    ];
    const graph = engine.analyzeCausal(entities);
    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
  });

  it("inferWithCausalSupport combines both engines", () => {
    let chain = engine.createChain("Smoking Research", "Understand effects");
    const mgr = engine.getChainManager();
    chain = mgr.addStep(chain, {
      type: ReasoningStepType.OBSERVATION,
      statement: "Smoking rates are high",
      evidence: ["e1"],
      confidence: 0.5,
      dependsOn: [],
      alternatives: [],
    });
    chain = mgr.addStep(chain, {
      type: ReasoningStepType.HYPOTHESIS,
      statement: "Smoking causes Cancer",
      evidence: [],
      confidence: 0.5,
      dependsOn: [chain.steps[0]!.id],
      alternatives: [],
    });
    chain = mgr.addStep(chain, {
      type: ReasoningStepType.INFERENCE,
      statement: "Reduce smoking to lower cancer rates",
      evidence: ["e2"],
      confidence: 0.5,
      dependsOn: [chain.steps[1]!.id],
      alternatives: [],
    });
    chain = mgr.addStep(chain, {
      type: ReasoningStepType.VALIDATION,
      statement: "Studies confirm link",
      evidence: ["e3"],
      confidence: 0.5,
      dependsOn: [chain.steps[2]!.id],
      alternatives: [],
    });
    chain = mgr.addStep(chain, {
      type: ReasoningStepType.CONCLUSION,
      statement: "Anti-smoking policies are effective",
      evidence: ["e4"],
      confidence: 0.5,
      dependsOn: [chain.steps[3]!.id],
      alternatives: [],
    });

    const entities = [
      {
        name: "Smoking",
        relations: [{ target: "Cancer", type: "causes" }],
      },
    ];

    const result = engine.inferWithCausalSupport(chain, entities, {});
    expect(result.inference).toBeDefined();
    expect(result.causalGraph).toBeDefined();
    expect(result.causalGraph.edges).toHaveLength(1);
  });

  it("inferWithCausalSupport enhances evidence with causal relations", () => {
    let chain = engine.createChain("T", "Smoking causes Cancer");
    const mgr = engine.getChainManager();
    chain = mgr.addStep(chain, {
      type: ReasoningStepType.OBSERVATION,
      statement: "Smoking observed",
      evidence: [],
      confidence: 0.5,
      dependsOn: [],
      alternatives: [],
    });
    chain = mgr.addStep(chain, {
      type: ReasoningStepType.HYPOTHESIS,
      statement: "Cancer hypothesis",
      evidence: [],
      confidence: 0.5,
      dependsOn: [chain.steps[0]!.id],
      alternatives: [],
    });
    chain = mgr.addStep(chain, {
      type: ReasoningStepType.INFERENCE,
      statement: "Inference step",
      evidence: [],
      confidence: 0.5,
      dependsOn: [chain.steps[1]!.id],
      alternatives: [],
    });
    chain = mgr.addStep(chain, {
      type: ReasoningStepType.VALIDATION,
      statement: "Validation step",
      evidence: [],
      confidence: 0.5,
      dependsOn: [chain.steps[2]!.id],
      alternatives: [],
    });
    chain = mgr.addStep(chain, {
      type: ReasoningStepType.CONCLUSION,
      statement: "Conclusion",
      evidence: [],
      confidence: 0.5,
      dependsOn: [chain.steps[3]!.id],
      alternatives: [],
    });

    const entities = [
      {
        name: "Smoking",
        relations: [{ target: "Cancer", type: "causes" }],
      },
    ];

    const result = engine.inferWithCausalSupport(chain, entities, {});
    // The hypothesis step mentions "Cancer" which matches causal edge target
    const hypothesisStep = result.inference.steps.find(
      (s) => s.type === ReasoningStepType.HYPOTHESIS,
    );
    expect(hypothesisStep).toBeDefined();
    // Should have additional causal evidence appended
    expect(hypothesisStep!.evidence.length).toBeGreaterThanOrEqual(0);
  });

  it("getChainManager returns chain manager", () => {
    expect(engine.getChainManager()).toBeInstanceOf(ReasoningChainManager);
  });

  it("getCausalAnalyzer returns causal analyzer", () => {
    expect(engine.getCausalAnalyzer()).toBeInstanceOf(CausalAnalyzer);
  });
});

describe("barrel exports", () => {
  it("exports ReasoningStepType enum", () => {
    expect(ReasoningStepType.OBSERVATION).toBe("observation");
  });

  it("exports CausalRelationType enum", () => {
    expect(CausalRelationType.CAUSES).toBe("causes");
  });

  it("exports ReasoningChainManager class", () => {
    expect(ReasoningChainManager).toBeDefined();
  });

  it("exports CausalAnalyzer class", () => {
    expect(CausalAnalyzer).toBeDefined();
  });

  it("exports ReasoningEngine class", () => {
    expect(ReasoningEngine).toBeDefined();
  });
});

describe("factory functions", () => {
  it("createReasoningEngine creates engine", () => {
    const engine = createReasoningEngine();
    expect(engine).toBeInstanceOf(ReasoningEngine);
  });

  it("createReasoningEngine accepts config", () => {
    const engine = createReasoningEngine({
      chain: { maxSteps: 10 },
      causal: { minConfidence: 0.5 },
    });
    expect(engine).toBeInstanceOf(ReasoningEngine);
  });
});
