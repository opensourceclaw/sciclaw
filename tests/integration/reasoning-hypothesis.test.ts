import { describe, it, expect } from "vitest";
import { createReasoningEngine, ReasoningStepType } from "../../src/reasoning/index.js";
import { createHypothesisEngine } from "../../src/hypothesis/index.js";
import type { ReasoningChain, ReasoningStep } from "../../src/reasoning/types.js";

describe("Reasoning → Hypothesis Integration", () => {
  it("should generate hypotheses from reasoning chain conclusions", () => {
    const reasoner = createReasoningEngine();
    const hypEngine = createHypothesisEngine();

    // Build a reasoning chain
    const chain = reasoner.createChain(
      "Economic impact of remote work",
      "Determine whether remote work increases productivity",
    );

    const steps: Omit<ReasoningStep, "id" | "timestamp">[] = [
      { type: ReasoningStepType.OBSERVATION, statement: "Remote work adoption increased 3x since 2020", evidence: ["BLS data"], confidence: 0.9, dependsOn: [], alternatives: [] },
      { type: ReasoningStepType.HYPOTHESIS, statement: "Remote work increases productivity", evidence: ["Stanford study"], confidence: 0.7, dependsOn: [], alternatives: ["Remote work decreases productivity", "No effect"] },
      { type: ReasoningStepType.INFERENCE, statement: "Companies report 13% productivity gain with remote options", evidence: ["Bloomberg survey"], confidence: 0.8, dependsOn: [], alternatives: [] },
      { type: ReasoningStepType.VALIDATION, statement: "Multiple studies across sectors confirm the trend", evidence: ["McKinsey", "Gallup"], confidence: 0.85, dependsOn: [], alternatives: [] },
      { type: ReasoningStepType.CONCLUSION, statement: "Remote work moderately increases productivity across most knowledge work sectors", evidence: ["Meta-analysis 2024"], confidence: 0.82, dependsOn: [], alternatives: ["Effect varies by role", "Productivity gains diminish over time"] },
    ];

    let chainWithSteps = chain;
    for (const step of steps) {
      chainWithSteps = reasoner.getChainManager().addStep(chainWithSteps, step);
    }

    const result = reasoner.infer(chainWithSteps, {});
    expect(result.conclusion).toBeTruthy();
    expect(result.confidence).toBeGreaterThan(0);

    // Convert conclusion to hypothesis evidence
    const evidence = chainWithSteps.steps.map((s) => ({
      id: s.id,
      source: "reasoning",
      content: s.statement,
      relevance: s.confidence,
      reliability: 0.85,
      type: "fact" as const,
      timestamp: new Date(),
    }));

    const hypotheses = hypEngine.generate(evidence);
    expect(hypotheses.length).toBeGreaterThan(0);
    expect(hypotheses[0]!.confidence).toBeGreaterThan(0);
  });

  it("should rank and validate hypotheses from reasoning output", () => {
    const hypEngine = createHypothesisEngine();

    const evidence = [
      { id: "e1", source: "reasoning", content: "CO2 emissions correlate with temperature rise", relevance: 0.9, reliability: 0.95, type: "data_point" as const, timestamp: new Date() },
      { id: "e2", source: "reasoning", content: "Methane has 25x warming potential of CO2", relevance: 0.85, reliability: 0.9, type: "fact" as const, timestamp: new Date() },
      { id: "e3", source: "reasoning", content: "Industrial activity increases greenhouse gas concentration", relevance: 0.8, reliability: 0.85, type: "observation" as const, timestamp: new Date() },
    ];

    const { ranked, validations } = hypEngine.generateRankAndValidate(evidence);

    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0]!.rank).toBe(1);

    for (const r of ranked) {
      const validation = validations.get(r.hypothesis.id);
      expect(validation).toBeDefined();
      expect(validation!.overallScore).toBeGreaterThanOrEqual(0);
      expect(validation!.overallScore).toBeLessThanOrEqual(1);
    }
  });

  it("should handle edge case: empty reasoning output", () => {
    const reasoner = createReasoningEngine();
    const hypEngine = createHypothesisEngine();

    const chain = reasoner.createChain("Empty test", "Test");
    const result = reasoner.infer(chain, {});

    expect(result.conclusion).toBe("");
    expect(result.confidence).toBe(0);

    const hypotheses = hypEngine.generate([]);
    expect(hypotheses).toEqual([]);
  });

  it("should enhance hypothesis generation with causal reasoning", () => {
    const reasoner = createReasoningEngine();

    const chain = reasoner.createChain("Drug efficacy", "Test if Drug X reduces symptom Y");
    const steps: Omit<ReasoningStep, "id" | "timestamp">[] = [
      { type: ReasoningStepType.OBSERVATION, statement: "Baseline symptom severity recorded", evidence: ["Clinical data"], confidence: 0.95, dependsOn: [], alternatives: [] },
      { type: ReasoningStepType.HYPOTHESIS, statement: "Drug X reduces symptom severity by 40%", evidence: ["Pre-trial data"], confidence: 0.6, dependsOn: [], alternatives: ["Drug X has no effect"] },
      { type: ReasoningStepType.INFERENCE, statement: "Treatment group shows 38% reduction vs 5% in placebo", evidence: ["Trial results"], confidence: 0.9, dependsOn: [], alternatives: [] },
      { type: ReasoningStepType.VALIDATION, statement: "Results are statistically significant (p<0.01)", evidence: ["Statistical analysis"], confidence: 0.95, dependsOn: [], alternatives: [] },
      { type: ReasoningStepType.CONCLUSION, statement: "Drug X significantly reduces symptom Y compared to placebo", evidence: ["RCT data"], confidence: 0.92, dependsOn: [], alternatives: ["Effect size smaller than hypothesized"] },
    ];

    let chainWithSteps = chain;
    for (const step of steps) {
      chainWithSteps = reasoner.getChainManager().addStep(chainWithSteps, step);
    }

    const entities = [
      { name: "Drug X", relations: [{ target: "Symptom Y", type: "reduces" }] },
    ];

    const { inference, causalGraph } = reasoner.inferWithCausalSupport(chainWithSteps, entities, {});

    expect(inference.conclusion).toBeTruthy();
    expect(causalGraph.nodes.length).toBeGreaterThan(0);
    expect(causalGraph.edges.length).toBeGreaterThan(0);
  });
});
