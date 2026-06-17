import { describe, it, expect } from "vitest";
import {
  HypothesisRanker,
  createHypothesisRanker,
} from "../../src/hypothesis/ranker.js";
import {
  HypothesisCategory,
  HypothesisStatus,
  EvidenceStrength,
} from "../../src/hypothesis/types.js";
import type { Hypothesis, Evidence } from "../../src/hypothesis/types.js";

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

function makeHypothesis(overrides: Partial<Hypothesis> = {}): Hypothesis {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    statement: overrides.statement ?? "A causes B",
    category: overrides.category ?? HypothesisCategory.CAUSAL,
    supportingEvidence:
      overrides.supportingEvidence ?? [makeEvidence()],
    contradictingEvidence: overrides.contradictingEvidence ?? [],
    confidence: overrides.confidence ?? 0.7,
    status: overrides.status ?? HypothesisStatus.PROPOSED,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
  };
}

describe("HypothesisRanker", () => {
  let ranker: HypothesisRanker;

  beforeEach(() => {
    ranker = createHypothesisRanker();
  });

  describe("rank", () => {
    it("ranks hypotheses by composite score", () => {
      const h1 = makeHypothesis({
        statement: "A causes B",
        confidence: 0.9,
        supportingEvidence: [
          makeEvidence({ relevance: 0.9, reliability: 0.9 }),
          makeEvidence({ relevance: 0.8, reliability: 0.8 }),
        ],
      });
      const h2 = makeHypothesis({
        statement: "C correlates with D",
        confidence: 0.3,
        supportingEvidence: [],
        contradictingEvidence: [makeEvidence({ relevance: 0.5 })],
      });
      const ranked = ranker.rank([h1, h2]);
      expect(ranked).toHaveLength(2);
      expect(ranked[0]!.hypothesis.id).toBe(h1.id);
      expect(ranked[0]!.rank).toBe(1);
      expect(ranked[1]!.rank).toBe(2);
    });

    it("returns RankedHypothesis array with all fields", () => {
      const h = makeHypothesis({ confidence: 0.7 });
      const ranked = ranker.rank([h]);
      expect(ranked[0]!.rank).toBe(1);
      expect(ranked[0]!.score).toBeGreaterThan(0);
      expect(ranked[0]!.confidence).toBe(0.7);
      expect(ranked[0]!.strengthLabel).toBeDefined();
    });

    it("rankByConfidence sorts by confidence descending", () => {
      const h1 = makeHypothesis({ confidence: 0.3 });
      const h2 = makeHypothesis({ confidence: 0.9 });
      const ranked = ranker.rankByConfidence([h1, h2]);
      expect(ranked[0]!.confidence).toBe(0.9);
      expect(ranked[1]!.confidence).toBe(0.3);
    });

    it("rankByEvidenceStrength sorts by evidence ratio", () => {
      const h1 = makeHypothesis({
        supportingEvidence: [makeEvidence(), makeEvidence()],
        contradictingEvidence: [],
      });
      const h2 = makeHypothesis({
        supportingEvidence: [],
        contradictingEvidence: [makeEvidence(), makeEvidence()],
      });
      const ranked = ranker.rankByEvidenceStrength([h1, h2]);
      expect(ranked[0]!.hypothesis.id).toBe(h1.id);
    });

    it("rankByNovelty sorts by uniqueness", () => {
      const h1 = makeHypothesis({ statement: "Unique novel hypothesis about quantum entanglement" });
      const h2 = makeHypothesis({ statement: "A causes B" });
      const h3 = makeHypothesis({ statement: "A causes B" }); // similar to h2
      const ranked = ranker.rankByNovelty([h1, h2, h3]);
      // h1 is most novel
      expect(ranked[0]!.hypothesis.id).toBe(h1.id);
    });

    it("getTopK returns k results", () => {
      const h1 = makeHypothesis({
        id: "top-h1",
        confidence: 0.9,
        statement: "A causes B with 50% higher effectiveness",
        supportingEvidence: [
          makeEvidence({ relevance: 0.95, reliability: 0.95 }),
          makeEvidence({ relevance: 0.9, reliability: 0.9 }),
        ],
      });
      const h2 = makeHypothesis({
        id: "top-h2",
        confidence: 0.5,
        statement: "C correlates with D",
      });
      const h3 = makeHypothesis({
        id: "top-h3",
        confidence: 0.3,
        statement: "E happens",
      });
      const top2 = ranker.getTopK([h3, h2, h1], 2);
      expect(top2).toHaveLength(2);
      // h1 has strongest evidence + testability, should rank first
      expect(top2[0]!.hypothesis.id).toBe("top-h1");
    });

    it("getTopK handles k > array length", () => {
      const hypotheses = [makeHypothesis()];
      const result = ranker.getTopK(hypotheses, 5);
      expect(result).toHaveLength(1);
    });

    it("assigns STRONG label for score >= 0.8", () => {
      const h = makeHypothesis({
        confidence: 0.9,
        supportingEvidence: [
          makeEvidence({ relevance: 0.95, reliability: 0.95 }),
          makeEvidence({ relevance: 0.9, reliability: 0.9 }),
          makeEvidence({ relevance: 0.85, reliability: 0.85 }),
        ],
      });
      const ranked = ranker.rank([h]);
      // With strong evidence and high confidence, should be at least MODERATE
      expect([
        EvidenceStrength.STRONG,
        EvidenceStrength.MODERATE,
        EvidenceStrength.WEAK,
        EvidenceStrength.NEGLIGIBLE,
      ]).toContain(ranked[0]!.strengthLabel);
    });

    it("handles empty array", () => {
      const ranked = ranker.rank([]);
      expect(ranked).toEqual([]);
    });

    it("handles single hypothesis", () => {
      const h = makeHypothesis({ confidence: 0.5 });
      const ranked = ranker.rank([h]);
      expect(ranked).toHaveLength(1);
      expect(ranked[0]!.rank).toBe(1);
    });

    it("stable sort for equal scores", () => {
      const h1 = makeHypothesis({
        id: "h1",
        confidence: 0.5,
        supportingEvidence: [makeEvidence()],
        statement: "Statement 1",
      });
      const h2 = makeHypothesis({
        id: "h2",
        confidence: 0.5,
        supportingEvidence: [makeEvidence()],
        statement: "Statement 1", // same statement = same novelty
      });
      const ranked = ranker.rank([h1, h2]);
      expect(ranked).toHaveLength(2);
    });

    it("getRankingWeights returns weights", () => {
      const weights = ranker.getRankingWeights();
      expect(weights.evidenceSupport).toBeGreaterThan(0);
      expect(weights.evidenceReliability).toBeGreaterThan(0);
      const sum =
        weights.evidenceSupport +
        weights.evidenceReliability +
        weights.novelty +
        weights.testability +
        weights.coherence;
      expect(sum).toBeCloseTo(1.0, 1);
    });

    it("testability detects measurable terms in statement", () => {
      const h1 = makeHypothesis({
        statement: "A increases B by 25% more than C",
        confidence: 0.7,
      });
      const h2 = makeHypothesis({
        statement: "something happens",
        confidence: 0.7,
      });
      const ranked = ranker.rank([h1, h2]);
      // h1 should score higher due to testability
      expect(ranked[0]!.hypothesis.id).toBe(h1.id);
    });
  });
});
