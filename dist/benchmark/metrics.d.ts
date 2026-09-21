import type { VerificationResult } from "../core/index.js";
export declare function computeFactuality(verified: VerificationResult[], expectedFacts: string[]): number;
export declare function computeCompleteness(sources: string[], actualSections: number, expectedSources: string[], minSections: number): number;
export declare function computeCitationQuality(citations: Array<{
    sourceId?: string;
    url?: string;
    qualityScore?: number;
    domain?: string;
}>): number;
export declare function computeReasoningDepth(longestPathLength: number, crossReferenceCount: number): number;
export declare function computeOverall(scores: {
    factuality: number;
    completeness: number;
    citation: number;
    reasoning: number;
}, weights: {
    factuality: number;
    completeness: number;
    citation: number;
    reasoning: number;
}): number;
//# sourceMappingURL=metrics.d.ts.map