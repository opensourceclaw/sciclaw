/**
 * Explainer - Facade for reasoning explanation and logging
 */
import { ReasoningLogger } from './logger.js';
import type { LogEntry, ConfidenceFactors, Explanation, EvidenceItem } from './types.js';
import type { ReasoningChain } from '../chain_of_thought/types.js';
export { ReasoningLogger } from './logger.js';
export { ConfidenceEvaluator } from './confidence.js';
export { ExplanationGenerator } from './generator.js';
export type { LogEntry, ConfidenceFactors, Explanation, ExplanationStep, EvidenceItem, } from './types.js';
export declare class Explainer {
    logger: ReasoningLogger;
    private confidenceEvaluator;
    private generator;
    constructor();
    evaluateConfidence(evidence: EvidenceItem[], chainLength: number, sourceAuthority?: number): ConfidenceFactors;
    generateExplanation(chain: ReasoningChain, confidence?: ConfidenceFactors): Explanation;
    getLogs(): LogEntry[];
    clearLogs(): void;
}
//# sourceMappingURL=index.d.ts.map