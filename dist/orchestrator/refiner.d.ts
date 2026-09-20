/**
 * SciClaw v3.3.0 — Iterative Refiner
 *
 * Rewrites queries based on blind spots and low-confidence claims to
 * improve research quality in subsequent iterations.
 */
import type { ResearchContext, RefinementResult } from "./types.js";
export interface RefinerConfig {
    maxRefinedQueries: number;
    minExpectedGain: number;
}
export declare class IterativeRefiner {
    private config;
    constructor(config?: Partial<RefinerConfig>);
    refine(context: ResearchContext): RefinementResult;
    /**
     * Decides whether the research loop should continue.
     * Returns false when no meaningful gaps remain or max iterations reached.
     */
    shouldContinue(context: ResearchContext): boolean;
    private prioritizeGaps;
    private expandWithSynonyms;
    private estimateGain;
    private suggestStrategy;
    private buildReason;
}
export declare function createIterativeRefiner(config?: Partial<RefinerConfig>): IterativeRefiner;
//# sourceMappingURL=refiner.d.ts.map