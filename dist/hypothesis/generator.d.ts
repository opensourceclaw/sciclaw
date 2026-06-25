import type { Evidence, Hypothesis, HypothesisConfig } from "./types.js";
export declare class HypothesisGenerator {
    private config;
    private totalGenerated;
    private totalRefined;
    constructor(config?: Partial<HypothesisConfig>);
    generate(evidence: Evidence[], context?: {
        topic?: string;
        domain?: string;
    }): Hypothesis[];
    refineHypothesis(hypothesis: Hypothesis, newEvidence: Evidence[]): Hypothesis;
    combineHypotheses(h1: Hypothesis, h2: Hypothesis): Hypothesis | null;
    getStats(): {
        totalGenerated: number;
        totalRefined: number;
    };
}
export declare function createHypothesisGenerator(config?: Partial<HypothesisConfig>): HypothesisGenerator;
//# sourceMappingURL=generator.d.ts.map