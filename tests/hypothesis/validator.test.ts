import { describe, it, expect } from "vitest";
import {
  HypothesisValidator,
  createHypothesisValidator,
} from "../../src/hypothesis/validator.js";
import { HypothesisCategory, HypothesisStatus } from "../../src/hypothesis/types.js";
import type { Hypothesis, Evidence } from "../../src/hypothesis/types.js";

function makeEvidence(overrides: Partial<Evidence> = {}): Evidence {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    source: overrides.source ?? "test",
    content: overrides.content ?? "test",
    relevance: overrides.relevance ?? 0.8,
    reliability: overrides.reliability ?? 0.7,
    type: overrides.type ?? "fact",
    timestamp: overrides.timestamp ?? new Date(),
  };
}

function makeHypothesis(overrides: Partial<Hypothesis> = {}): Hypothesis {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    statement: overrides.statement ?? "Increased CO2 emissions cause global temperature rise",
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

describe("HypothesisValidator", () => {
  let validator: HypothesisValidator;

  beforeEach(() => {
    validator = createHypothesisValidator();
  });

  describe("validate", () => {
    it("validates feasible hypothesis", () => {
      const h = makeHypothesis();
      const result = validator.validate(h);
      expect(result.feasible).toBe(true);
      expect(result.overallScore).toBeGreaterThan(0);
    });

    it("rejects empty statement as infeasible", () => {
      const h = makeHypothesis({ statement: "" });
      const result = validator.validate(h);
      expect(result.feasible).toBe(false);
      expect(result.issues.some((i) => i.severity === "error")).toBe(true);
    });

    it("rejects confidence outside [0,1]", () => {
      const h = makeHypothesis({ confidence: 1.5 });
      const result = validator.validate(h);
      expect(result.feasible).toBe(false);
    });

    it("flags absolute claims as warning", () => {
      const h = makeHypothesis({
        statement: "All smokers always develop cancer",
      });
      const result = validator.validate(h);
      expect(result.issues.some((i) => i.severity === "warning")).toBe(true);
    });

    it("detects testable hypothesis", () => {
      const h = makeHypothesis({
        statement: "Temperature increase causes 15% more rainfall",
      });
      const result = validator.validate(h);
      expect(result.testable).toBe(true);
    });

    it("flags unfalsifiable tautology", () => {
      const h = makeHypothesis({
        statement: "Either it rains or it does not rain",
      });
      const result = validator.validate(h);
      expect(result.falsifiable).toBe(false);
    });

    it("validateBatch processes all hypotheses", () => {
      const hypotheses = [
        makeHypothesis({ id: "h1", statement: "A causes B" }),
        makeHypothesis({ id: "h2", statement: "C leads to D" }),
        makeHypothesis({ id: "h3", statement: "E influences F by 30%" }),
      ];
      const results = validator.validateBatch(hypotheses);
      expect(results).toHaveLength(3);
    });

    it("isFeasible returns boolean", () => {
      const valid = makeHypothesis({ statement: "A valid hypothesis with enough length" });
      expect(validator.isFeasible(valid)).toBe(true);

      const invalid = makeHypothesis({ statement: "" });
      expect(validator.isFeasible(invalid)).toBe(false);
    });

    it("isTestable returns boolean", () => {
      const testable = makeHypothesis({
        statement: "A causes 15% increase in B compared to C",
      });
      expect(validator.isTestable(testable)).toBe(true);

      const untestable = makeHypothesis({
        statement: "something vague happens",
      });
      expect(validator.isTestable(untestable)).toBe(false);
    });

    it("isFalsifiable returns boolean", () => {
      const falsifiable = makeHypothesis({
        statement: "CO2 emissions above 400ppm cause temperature increase",
      });
      expect(validator.isFalsifiable(falsifiable)).toBe(true);

      const unfalsifiable = makeHypothesis({
        statement: "Either it is or it is not the case",
      });
      expect(validator.isFalsifiable(unfalsifiable)).toBe(false);
    });

    it("computes novelty score", () => {
      const novel = makeHypothesis({
        statement: "Quantum decoherence influences neural microtubule computation",
      });
      const result = validator.validate(novel);
      expect(result.novelty).toBeGreaterThan(0.5);
    });

    it("assigns low novelty to common knowledge", () => {
      const common = makeHypothesis({
        statement: "Water boils when heated to 100 degrees",
      });
      const result = validator.validate(common);
      expect(result.novelty).toBeLessThanOrEqual(0.2);
    });

    it("computes clarity score", () => {
      const clear = makeHypothesis({
        statement: "Regular exercise of 30 minutes daily reduces cardiovascular disease risk by 20%",
      });
      const result = validator.validate(clear);
      expect(result.clarity).toBeGreaterThan(0.5);
    });

    it("flags short statements with low clarity", () => {
      const short = makeHypothesis({ statement: "X causes Y" });
      const result = validator.validate(short);
      expect(result.clarity).toBeLessThanOrEqual(0.5);
    });

    it("getValidationStats tracks counts", () => {
      validator.validate(makeHypothesis({ statement: "Valid hypothesis with evidence" }));
      validator.validate(makeHypothesis({ statement: "" })); // infeasible
      const stats = validator.getValidationStats();
      expect(stats.totalValidated).toBe(2);
      expect(stats.feasibleCount).toBe(1);
      expect(stats.infeasibleCount).toBe(1);
    });
  });
});
