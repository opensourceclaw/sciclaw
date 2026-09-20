/**
 * SciClaw v3.0.0 — Hypothesis Engine
 *
 * Unified hypothesis engine coordinating generation, ranking, and validation.
 */
import type { Evidence, Hypothesis, RankedHypothesis, ValidationResult, HypothesisConfig } from "./types.js";
import { HypothesisGenerator } from "./generator.js";
import { HypothesisRanker } from "./ranker.js";
import { HypothesisValidator } from "./validator.js";
export * from "./types.js";
export * from "./generator.js";
export * from "./ranker.js";
export * from "./validator.js";
export interface HypothesisEngineConfig {
    generator?: Partial<HypothesisConfig>;
    ranker?: Partial<HypothesisConfig>;
    validator?: Partial<HypothesisConfig>;
}
export declare class HypothesisEngine {
    private generator;
    private ranker;
    private validator;
    constructor(config?: HypothesisEngineConfig);
    generate(evidence: Evidence[]): Hypothesis[];
    rank(hypotheses: Hypothesis[]): RankedHypothesis[];
    validate(hypothesis: Hypothesis): ValidationResult;
    generateAndRank(evidence: Evidence[]): RankedHypothesis[];
    generateRankAndValidate(evidence: Evidence[]): {
        ranked: RankedHypothesis[];
        validations: Map<string, ValidationResult>;
    };
    getStats(): {
        totalGenerated: number;
        totalRanked: number;
        totalValidated: number;
    };
    getGenerator(): HypothesisGenerator;
    getRanker(): HypothesisRanker;
    getValidator(): HypothesisValidator;
}
export declare function createHypothesisEngine(config?: HypothesisEngineConfig): HypothesisEngine;
//# sourceMappingURL=index.d.ts.map