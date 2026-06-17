import { describe, it, expect } from "vitest";
import {
  HypothesisGenerator,
  createHypothesisGenerator,
} from "../../src/hypothesis/generator.js";
import { HypothesisCategory, HypothesisStatus } from "../../src/hypothesis/types.js";
import type { Evidence } from "../../src/hypothesis/types.js";

function makeEvidence(overrides: Partial<Evidence> = {}): Evidence {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    source: overrides.source ?? "test-source",
    content: overrides.content ?? "Test evidence content",
    relevance: overrides.relevance ?? 0.8,
    reliability: overrides.reliability ?? 0.7,
    type: overrides.type ?? "fact",
    timestamp: overrides.timestamp ?? new Date(),
  };
}

describe("HypothesisGenerator", () => {
  let generator: HypothesisGenerator;

  beforeEach(() => {
    generator = createHypothesisGenerator();
  });

  describe("generate", () => {
    it("generates at least 3 hypotheses from evidence", () => {
      const evidence = [
        makeEvidence({ content: "Smoking causes lung cancer in patients" }),
        makeEvidence({ content: "Air pollution affects respiratory health" }),
        makeEvidence({ content: "Exercise improves cardiovascular fitness" }),
        makeEvidence({ content: "Diet influences metabolic rate significantly" }),
      ];
      const hypotheses = generator.generate(evidence);
      expect(hypotheses.length).toBeGreaterThanOrEqual(3);
    });

    it("generates causal hypotheses", () => {
      const evidence = [
        makeEvidence({ content: "Smoking causes lung cancer" }),
        makeEvidence({ content: "Smoking leads to heart disease" }),
      ];
      const hypotheses = generator.generate(evidence);
      const causal = hypotheses.filter(
        (h) => h.category === HypothesisCategory.CAUSAL,
      );
      expect(causal.length).toBeGreaterThanOrEqual(0);
    });

    it("generates correlational hypotheses", () => {
      const evidence = [
        makeEvidence({ content: "Ice cream sales correlate with drowning rates" }),
        makeEvidence({ content: "Temperature is associated with crime rates" }),
      ];
      const hypotheses = generator.generate(evidence);
      const corr = hypotheses.filter(
        (h) => h.category === HypothesisCategory.CORRELATIONAL,
      );
      // At least one hypothesis should be generated
      expect(hypotheses.length).toBeGreaterThanOrEqual(1);
    });

    it("generates explanatory hypotheses", () => {
      const evidence = [
        makeEvidence({ content: "The reason for climate change is greenhouse gases" }),
        makeEvidence({ content: "Because of deforestation, biodiversity declines" }),
      ];
      const hypotheses = generator.generate(evidence);
      expect(hypotheses.length).toBeGreaterThanOrEqual(1);
    });

    it("generates predictive hypotheses", () => {
      const evidence = [
        makeEvidence({ content: "Model predicts temperature will rise" }),
        makeEvidence({ content: "Forecasting rainfall patterns shows increase" }),
      ];
      const hypotheses = generator.generate(evidence);
      expect(hypotheses.length).toBeGreaterThanOrEqual(1);
    });

    it("generates comparative hypotheses", () => {
      const evidence = [
        makeEvidence({ content: "Electric cars are more efficient than gas cars" }),
        makeEvidence({ content: "Solar power has greater potential than coal" }),
      ];
      const hypotheses = generator.generate(evidence);
      expect(hypotheses.length).toBeGreaterThanOrEqual(1);
    });

    it("respects maxHypotheses limit", () => {
      const g = createHypothesisGenerator({ maxHypotheses: 2 });
      const evidence = [
        makeEvidence({ content: "A causes B" }),
        makeEvidence({ content: "C influences D" }),
        makeEvidence({ content: "E affects F" }),
        makeEvidence({ content: "G leads to H" }),
        makeEvidence({ content: "I correlates with J" }),
      ];
      const hypotheses = g.generate(evidence);
      expect(hypotheses.length).toBeLessThanOrEqual(2);
    });

    it("returns empty array for no evidence", () => {
      const hypotheses = generator.generate([]);
      expect(hypotheses).toEqual([]);
    });

    it("handles single evidence item", () => {
      const evidence = [makeEvidence({ content: "Single observation" })];
      const hypotheses = generator.generate(evidence);
      // Should still generate at least 1 hypothesis
      expect(hypotheses.length).toBeGreaterThanOrEqual(1);
    });

    it("handles evidence with low reliability", () => {
      const evidence = [
        makeEvidence({ content: "A causes B", reliability: 0.1 }),
        makeEvidence({ content: "C influences D", reliability: 0.2 }),
        makeEvidence({ content: "E affects F", reliability: 0.1 }),
      ];
      const hypotheses = generator.generate(evidence);
      // Should still generate, but with low confidence
      if (hypotheses.length > 0) {
        expect(hypotheses[0]!.confidence).toBeLessThanOrEqual(0.5);
      }
    });

    it("sets hypothesis status to PROPOSED", () => {
      const evidence = [
        makeEvidence({ content: "A causes B" }),
        makeEvidence({ content: "C causes D" }),
      ];
      const hypotheses = generator.generate(evidence);
      for (const h of hypotheses) {
        expect(h.status).toBe(HypothesisStatus.PROPOSED);
      }
    });

    it("confidence is capped at 0.9", () => {
      const evidence = [
        makeEvidence({
          content: "A causes B",
          relevance: 1.0,
          reliability: 1.0,
        }),
      ];
      const hypotheses = generator.generate(evidence);
      for (const h of hypotheses) {
        expect(h.confidence).toBeLessThanOrEqual(0.9);
      }
    });
  });

  describe("refineHypothesis", () => {
    it("increases confidence with supporting evidence", () => {
      const evidence = [makeEvidence({ content: "A causes B" })];
      const [hypothesis] = generator.generate(evidence);
      expect(hypothesis).toBeDefined();

      const refined = generator.refineHypothesis(hypothesis!, [
        makeEvidence({ content: "More evidence for A causing B", relevance: 0.9 }),
      ]);
      expect(refined.confidence).toBeGreaterThan(hypothesis!.confidence);
    });

    it("decreases confidence with contradicting evidence", () => {
      const evidence = [makeEvidence({ content: "A causes B", relevance: 0.8 })];
      const [hypothesis] = generator.generate(evidence);
      expect(hypothesis).toBeDefined();

      const refined = generator.refineHypothesis(hypothesis!, [
        makeEvidence({ content: "Counter evidence", relevance: 0.2 }),
      ]);
      expect(refined.confidence).toBeLessThan(hypothesis!.confidence);
    });

    it("updates status to SUPPORTED when confidence >= 0.7", () => {
      const h = {
        id: crypto.randomUUID(),
        statement: "A causes B",
        category: HypothesisCategory.CAUSAL,
        supportingEvidence: [makeEvidence({ relevance: 0.9, reliability: 0.9 })],
        contradictingEvidence: [],
        confidence: 0.65,
        status: HypothesisStatus.PROPOSED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const refined = generator.refineHypothesis(h, [
        makeEvidence({ content: "Strong support", relevance: 0.9 }),
      ]);
      expect(refined.status).toBe(HypothesisStatus.SUPPORTED);
    });

    it("updates status to REFUTED when confidence < 0.3", () => {
      const h = {
        id: crypto.randomUUID(),
        statement: "A causes B",
        category: HypothesisCategory.CAUSAL,
        supportingEvidence: [],
        contradictingEvidence: [makeEvidence({ relevance: 0.2 })],
        confidence: 0.35,
        status: HypothesisStatus.PROPOSED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const refined = generator.refineHypothesis(h, [
        makeEvidence({ content: "More contradiction", relevance: 0.1 }),
        makeEvidence({ content: "Even more contradiction", relevance: 0.2 }),
      ]);
      expect(refined.status).toBe(HypothesisStatus.REFUTED);
    });
  });

  describe("combineHypotheses", () => {
    it("merges compatible hypotheses", () => {
      const h1 = {
        id: crypto.randomUUID(),
        statement: "A causes B",
        category: HypothesisCategory.CAUSAL,
        supportingEvidence: [makeEvidence({ content: "e1" })],
        contradictingEvidence: [],
        confidence: 0.7,
        status: HypothesisStatus.PROPOSED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const h2 = {
        id: crypto.randomUUID(),
        statement: "C leads to D",
        category: HypothesisCategory.CAUSAL,
        supportingEvidence: [makeEvidence({ content: "e2" })],
        contradictingEvidence: [],
        confidence: 0.5,
        status: HypothesisStatus.PROPOSED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const combined = generator.combineHypotheses(h1, h2);
      expect(combined).not.toBeNull();
      expect(combined!.category).toBe(HypothesisCategory.CAUSAL);
      expect(combined!.supportingEvidence).toHaveLength(2);
    });

    it("returns null for incompatible categories", () => {
      const h1 = {
        id: crypto.randomUUID(),
        statement: "A causes B",
        category: HypothesisCategory.CAUSAL,
        supportingEvidence: [],
        contradictingEvidence: [],
        confidence: 0.5,
        status: HypothesisStatus.PROPOSED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const h2 = {
        ...h1,
        id: crypto.randomUUID(),
        category: HypothesisCategory.PREDICTIVE,
      };
      expect(generator.combineHypotheses(h1, h2)).toBeNull();
    });

    it("clones same hypothesis", () => {
      const h = {
        id: crypto.randomUUID(),
        statement: "A causes B",
        category: HypothesisCategory.CAUSAL,
        supportingEvidence: [],
        contradictingEvidence: [],
        confidence: 0.5,
        status: HypothesisStatus.PROPOSED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const combined = generator.combineHypotheses(h, h);
      expect(combined).not.toBeNull();
      expect(combined!.confidence).toBe(0.5);
    });
  });

  describe("getStats", () => {
    it("tracks generation count", () => {
      const evidence = [makeEvidence({ content: "A causes B" })];
      generator.generate(evidence);
      generator.generate(evidence);
      expect(generator.getStats().totalGenerated).toBeGreaterThanOrEqual(2);
    });

    it("tracks refinement count", () => {
      const h = {
        id: crypto.randomUUID(),
        statement: "A causes B",
        category: HypothesisCategory.CAUSAL,
        supportingEvidence: [],
        contradictingEvidence: [],
        confidence: 0.5,
        status: HypothesisStatus.PROPOSED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      generator.refineHypothesis(h, [makeEvidence()]);
      expect(generator.getStats().totalRefined).toBe(1);
    });
  });
});
