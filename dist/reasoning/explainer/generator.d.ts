/**
 * Explanation Generator - Converts reasoning chains to natural language explanations
 */
import type { Explanation, ConfidenceFactors } from './types.js';
import type { ReasoningChain } from '../chain_of_thought/types.js';
export declare class ExplanationGenerator {
    generate(chain: ReasoningChain, confidence: ConfidenceFactors): Explanation;
    private buildJustification;
    private collectEvidence;
    private buildSummary;
}
//# sourceMappingURL=generator.d.ts.map