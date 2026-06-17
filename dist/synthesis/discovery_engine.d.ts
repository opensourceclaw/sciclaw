/**
 * DeepClaw v3.0.0-beta.3 — Discovery Engine
 *
 * Automated discovery loop: pattern recognition across domains,
 * novel insight generation, and research gap identification.
 */
import type { DiscoveryResult, DomainEvidence } from "./types.js";
export interface DiscoveryConfig {
    /** Minimum frequency for a term to be considered a pattern */
    minTermFrequency: number;
    /** Minimum number of domains for a cross-domain pattern */
    minCrossDomainCount: number;
    /** Maximum patterns to return */
    maxPatterns: number;
    /** Maximum gaps to report */
    maxGaps: number;
}
export declare const DEFAULT_DISCOVERY_CONFIG: DiscoveryConfig;
export declare class DiscoveryEngine {
    private config;
    constructor(config?: Partial<DiscoveryConfig>);
    /**
     * Discover patterns and research gaps from domain evidence.
     */
    discover(evidence: DomainEvidence[]): DiscoveryResult;
    private _findPatterns;
    private _identifyGaps;
    private _buildSummary;
}
/** Factory function for DiscoveryEngine */
export declare function createDiscoveryEngine(config?: Partial<DiscoveryConfig>): DiscoveryEngine;
//# sourceMappingURL=discovery_engine.d.ts.map