/**
 * Confidence Evaluator - Assesses confidence of reasoning results
 */
import type { ConfidenceFactors, EvidenceItem } from './types.js';
export declare class ConfidenceEvaluator {
    evaluate(evidence: EvidenceItem[], chainLength: number, sourceAuthority?: number): ConfidenceFactors;
    evaluateFromResults(results: Array<{
        confidence: number;
        status: string;
    }>): ConfidenceFactors;
}
//# sourceMappingURL=confidence.d.ts.map