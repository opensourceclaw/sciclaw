/**
 * DeepClaw v3.0.0 — Hypothesis Engine
 *
 * Unified hypothesis engine coordinating generation, ranking, and validation.
 */
import type {
  Evidence,
  Hypothesis,
  RankedHypothesis,
  ValidationResult,
  HypothesisConfig,
} from "./types.js";
import {
  HypothesisGenerator,
  createHypothesisGenerator,
} from "./generator.js";
import { HypothesisRanker, createHypothesisRanker } from "./ranker.js";
import {
  HypothesisValidator,
  createHypothesisValidator,
} from "./validator.js";

export * from "./types.js";
export * from "./generator.js";
export * from "./ranker.js";
export * from "./validator.js";

// ── Config ─────────────────────────────────────────────────────────────

export interface HypothesisEngineConfig {
  generator?: Partial<HypothesisConfig>;
  ranker?: Partial<HypothesisConfig>;
  validator?: Partial<HypothesisConfig>;
}

// ── HypothesisEngine ───────────────────────────────────────────────────

export class HypothesisEngine {
  private generator: HypothesisGenerator;
  private ranker: HypothesisRanker;
  private validator: HypothesisValidator;

  constructor(config?: HypothesisEngineConfig) {
    this.generator = createHypothesisGenerator(config?.generator);
    this.ranker = createHypothesisRanker(config?.ranker);
    this.validator = createHypothesisValidator(config?.validator);
  }

  generate(evidence: Evidence[]): Hypothesis[] {
    return this.generator.generate(evidence);
  }

  rank(hypotheses: Hypothesis[]): RankedHypothesis[] {
    return this.ranker.rank(hypotheses);
  }

  validate(hypothesis: Hypothesis): ValidationResult {
    return this.validator.validate(hypothesis);
  }

  generateAndRank(evidence: Evidence[]): RankedHypothesis[] {
    const hypotheses = this.generator.generate(evidence);
    return this.ranker.rank(hypotheses);
  }

  generateRankAndValidate(evidence: Evidence[]): {
    ranked: RankedHypothesis[];
    validations: Map<string, ValidationResult>;
  } {
    const hypotheses = this.generator.generate(evidence);
    const ranked = this.ranker.rank(hypotheses);
    const validations = new Map<string, ValidationResult>();
    for (const r of ranked) {
      validations.set(
        r.hypothesis.id,
        this.validator.validate(r.hypothesis),
      );
    }
    return { ranked, validations };
  }

  getStats(): {
    totalGenerated: number;
    totalRanked: number;
    totalValidated: number;
  } {
    const genStats = this.generator.getStats();
    const valStats = this.validator.getValidationStats();
    return {
      totalGenerated: genStats.totalGenerated,
      totalRanked: genStats.totalGenerated, // rank is called after generate
      totalValidated: valStats.totalValidated,
    };
  }

  getGenerator(): HypothesisGenerator {
    return this.generator;
  }

  getRanker(): HypothesisRanker {
    return this.ranker;
  }

  getValidator(): HypothesisValidator {
    return this.validator;
  }
}

export function createHypothesisEngine(
  config?: HypothesisEngineConfig,
): HypothesisEngine {
  return new HypothesisEngine(config);
}
