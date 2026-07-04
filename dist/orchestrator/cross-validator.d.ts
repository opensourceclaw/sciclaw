/**
 * DeepClaw v3.3.0 — Cross-Validation Engine
 *
 * Extracts factual claims from search results, cross-validates them across
 * sources, computes confidence scores, and detects contradictions.
 */
import type { RawClaim, ValidatedClaim, Contradiction, ResearchSearchResult, ConfidenceConfig } from "./types.js";
export declare class CrossValidator {
    private config;
    constructor(config?: ConfidenceConfig);
    /** Extracts factual claims from search result snippets. */
    extractClaims(results: ResearchSearchResult[]): RawClaim[];
    /**
     * Cross-validates claims across sources.
     *
     * Confidence model:
     *   confidence = agreement_weight × agreement_score
     *              + source_credibility_weight × avg_credibility
     *              + freshness_weight × freshness_score
     */
    validate(rawClaims: RawClaim[], results: ResearchSearchResult[]): ValidatedClaim[];
    /** Clusters similar claims together using Jaccard similarity. */
    private clusterClaims;
    /** Finds sources that contradict the claim. */
    private findContradictingSources;
    /** Computes confidence using the weighted model. */
    computeConfidence(supportingSources: string[], contradictingSources: string[], snippets: string[]): number;
    /** Detects contradictions between validated claims. */
    findContradictions(claims: ValidatedClaim[]): Contradiction[];
}
export declare function createCrossValidator(config?: Partial<ConfidenceConfig>): CrossValidator;
//# sourceMappingURL=cross-validator.d.ts.map