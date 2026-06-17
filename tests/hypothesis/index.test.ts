import { describe, it, expect } from "vitest";
import {
  HypothesisEngine,
  createHypothesisEngine,
} from "../../src/hypothesis/index.js";
import { HypothesisGenerator } from "../../src/hypothesis/generator.js";
import { HypothesisRanker } from "../../src/hypothesis/ranker.js";
import { HypothesisValidator } from "../../src/hypothesis/validator.js";
import {
  HypothesisCategory,
  HypothesisStatus,
  EvidenceStrength,
} from "../../src/hypothesis/types.js";
import type { Evidence } from "../../src/hypothesis/types.js";

function makeEvidence(overrides: Partial<Evidence> = {}): Evidence {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    source: overrides.source ?? "test",
    content: overrides.content ?? "test content",
    relevance: overrides.relevance ?? 0.8,
    reliability: overrides.reliability ?? 0.7,
    type: overrides.type ?? "fact",
    timestamp: overrides.timestamp ?? new Date(),
  };
}

describe("HypothesisEngine", () => {
  let engine: HypothesisEngine;

  beforeEach(() => {
    engine = createHypothesisEngine();
  });

  it("creates HypothesisEngine", () => {
    expect(engine).toBeInstanceOf(HypothesisEngine);
  });

  it("generate delegates to generator", () => {
    const evidence = [
      makeEvidence({ content: "Smoking causes cancer" }),
      makeEvidence({ content: "Exercise improves health" }),
      makeEvidence({ content: "Diet affects weight" }),
    ];
    const hypotheses = engine.generate(evidence);
    expect(hypotheses.length).toBeGreaterThanOrEqual(1);
  });

  it("rank delegates to ranker", () => {
    const evidence = [
      makeEvidence({ content: "A causes B" }),
      makeEvidence({ content: "C leads to D" }),
    ];
    const hypotheses = engine.generate(evidence);
    const ranked = engine.rank(hypotheses);
    expect(ranked.length).toBe(hypotheses.length);
    expect(ranked[0]!.rank).toBe(1);
  });

  it("validate delegates to validator", () => {
    const evidence = [makeEvidence({ content: "A valid test hypothesis with sufficient length" })];
    const [h] = engine.generate(evidence);
    expect(h).toBeDefined();
    const result = engine.validate(h!);
    expect(result.hypothesisId).toBe(h!.id);
    expect(result.overallScore).toBeDefined();
  });

  it("generateAndRank pipeline works end-to-end", () => {
    const evidence = [
      makeEvidence({ content: "Smoking causes lung cancer in patients" }),
      makeEvidence({ content: "Air pollution affects respiratory health" }),
      makeEvidence({ content: "Exercise improves cardiovascular fitness" }),
      makeEvidence({ content: "Diet influences metabolic rate" }),
    ];
    const ranked = engine.generateAndRank(evidence);
    expect(ranked.length).toBeGreaterThanOrEqual(1);
    expect(ranked[0]!.rank).toBe(1);
  });

  it("generateRankAndValidate pipeline returns ranked and validated", () => {
    const evidence = [
      makeEvidence({ content: "CO2 emissions cause global warming effect" }),
      makeEvidence({ content: "Renewable energy reduces carbon footprint" }),
      makeEvidence({ content: "Deforestation leads to habitat loss" }),
    ];
    const result = engine.generateRankAndValidate(evidence);
    expect(result.ranked.length).toBeGreaterThanOrEqual(1);
    expect(result.validations.size).toBe(result.ranked.length);
  });

  it("getStats returns metrics", () => {
    const evidence = [makeEvidence({ content: "Test hypothesis with enough content" })];
    engine.generate(evidence);
    const stats = engine.getStats();
    expect(stats.totalGenerated).toBeGreaterThanOrEqual(1);
  });

  it("getGenerator returns generator", () => {
    expect(engine.getGenerator()).toBeInstanceOf(HypothesisGenerator);
  });

  it("getRanker returns ranker", () => {
    expect(engine.getRanker()).toBeInstanceOf(HypothesisRanker);
  });

  it("getValidator returns validator", () => {
    expect(engine.getValidator()).toBeInstanceOf(HypothesisValidator);
  });
});

describe("barrel exports", () => {
  it("exports HypothesisCategory enum", () => {
    expect(HypothesisCategory.CAUSAL).toBe("causal");
  });

  it("exports HypothesisStatus enum", () => {
    expect(HypothesisStatus.PROPOSED).toBe("proposed");
  });

  it("exports EvidenceStrength enum", () => {
    expect(EvidenceStrength.STRONG).toBe("strong");
  });

  it("exports HypothesisGenerator class", () => {
    expect(HypothesisGenerator).toBeDefined();
  });

  it("exports HypothesisRanker class", () => {
    expect(HypothesisRanker).toBeDefined();
  });

  it("exports HypothesisValidator class", () => {
    expect(HypothesisValidator).toBeDefined();
  });

  it("exports HypothesisEngine class", () => {
    expect(HypothesisEngine).toBeDefined();
  });
});

describe("factory functions", () => {
  it("createHypothesisEngine creates engine", () => {
    const e = createHypothesisEngine();
    expect(e).toBeInstanceOf(HypothesisEngine);
  });

  it("createHypothesisEngine accepts config", () => {
    const e = createHypothesisEngine({
      generator: { maxHypotheses: 5 },
      ranker: {
        rankingWeights: {
          evidenceSupport: 0.5,
          evidenceReliability: 0.2,
          novelty: 0.1,
          testability: 0.1,
          coherence: 0.1,
        },
      },
    });
    expect(e).toBeInstanceOf(HypothesisEngine);
  });
});
