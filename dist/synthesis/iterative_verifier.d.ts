/**
 * SciClaw v3.0.0-beta.3 — Iterative Verifier
 *
 * Hypothesis → Test → Refine automated verification loop.
 * Validates claims through multi-source evidence, contradiction
 * detection, and confidence calibration.
 */
import type { VerificationLoop, DomainEvidence } from "./types.js";
export interface VerifierConfig {
    /** Maximum iterations before forced conclusion */
    maxIterations: number;
    /** Confidence threshold for "confirmed" conclusion */
    confirmThreshold: number;
    /** Confidence threshold below which conclusion is "rejected" */
    rejectThreshold: number;
    /** Minimum number of supporting sources for a "pass" */
    minSourcesForPass: number;
}
export declare const DEFAULT_VERIFIER_CONFIG: VerifierConfig;
export declare class IterativeVerifier {
    private config;
    constructor(config?: Partial<VerifierConfig>);
    /**
     * Run a verification loop for a hypothesis against available evidence.
     */
    verify(hypothesis: string, evidenceSets: DomainEvidence[]): VerificationLoop;
    private _runIteration;
    private _extractKeyTerms;
    private _semanticOverlap;
    private _updateConfidence;
    private _refineHypothesis;
    private _determineConclusion;
}
/** Factory function for IterativeVerifier */
export declare function createIterativeVerifier(config?: Partial<VerifierConfig>): IterativeVerifier;
//# sourceMappingURL=iterative_verifier.d.ts.map