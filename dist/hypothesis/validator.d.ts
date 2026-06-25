import type { Hypothesis, ValidationResult, HypothesisConfig } from "./types.js";
export declare class HypothesisValidator {
    private config;
    private totalValidated;
    private feasibleCount;
    private infeasibleCount;
    constructor(config?: Partial<HypothesisConfig>);
    validate(hypothesis: Hypothesis): ValidationResult;
    validateBatch(hypotheses: Hypothesis[]): ValidationResult[];
    isFeasible(hypothesis: Hypothesis): boolean;
    isTestable(hypothesis: Hypothesis): boolean;
    isFalsifiable(hypothesis: Hypothesis): boolean;
    getValidationStats(): {
        totalValidated: number;
        feasibleCount: number;
        infeasibleCount: number;
    };
}
export declare function createHypothesisValidator(config?: Partial<HypothesisConfig>): HypothesisValidator;
//# sourceMappingURL=validator.d.ts.map