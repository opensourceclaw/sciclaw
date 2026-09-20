/**
 * SciClaw v3.0.0-beta.3 — Cross-Domain Synthesizer
 *
 * Identifies connections across knowledge domains, maps relationships,
 * and fuses multi-source evidence into coherent cross-domain insights.
 */
import type { CrossDomainResult, DomainEvidence } from "./types.js";
export interface CrossDomainConfig {
    /** Minimum term overlap to consider two domains related (0.0–1.0) */
    minOverlap: number;
    /** Maximum connections to return */
    maxConnections: number;
    /** Minimum confidence for an insight to be included */
    minConfidence: number;
}
export declare const DEFAULT_CROSS_DOMAIN_CONFIG: CrossDomainConfig;
export declare class CrossDomainSynthesizer {
    private config;
    constructor(config?: Partial<CrossDomainConfig>);
    /**
     * Synthesize cross-domain connections and insights from multiple
     * domain evidence sets.
     */
    synthesize(evidence: DomainEvidence[]): CrossDomainResult;
    private _findConnections;
    private _connectPair;
    private _detectConnectionType;
    private _extractInsights;
    private _buildInsightStatement;
    private _computeOverallConfidence;
}
/** Factory function for CrossDomainSynthesizer */
export declare function createCrossDomainSynthesizer(config?: Partial<CrossDomainConfig>): CrossDomainSynthesizer;
//# sourceMappingURL=cross_domain_synthesizer.d.ts.map