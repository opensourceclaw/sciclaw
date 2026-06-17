/**
 * DeepClaw v3.0.0-rc.1 — Knowledge Evolution
 *
 * Dynamic knowledge graph updates, fact freshness tracking,
 * outdated information flagging, and knowledge versioning.
 */
import type { Fact, FactUpdate, FreshnessReport } from "./types.js";
export interface KnowledgeEvolutionConfig {
    freshnessThresholdHigh: number;
    freshnessThresholdLow: number;
    freshnessDecayRate: number;
    maxFactVersions: number;
    minConfidenceForFact: number;
}
export declare const DEFAULT_KNOWLEDGE_EVOLUTION_CONFIG: KnowledgeEvolutionConfig;
export declare class KnowledgeEvolution {
    private config;
    private facts;
    private updateLog;
    constructor(config?: Partial<KnowledgeEvolutionConfig>);
    /** Update knowledge base with new facts */
    updateKnowledge(newFacts: Fact[]): Promise<void>;
    /** Get freshness report for all facts */
    getFreshnessReport(): FreshnessReport;
    /** Get outdated facts that need review */
    getOutdatedFacts(): Fact[];
    /** Get facts by domain */
    getFactsByDomain(domain: string): Fact[];
    /** Get all facts */
    getAllFacts(): Fact[];
    /** Get fact update history */
    getUpdateLog(): FactUpdate[];
    /** Mark facts as verified (reset freshness) */
    verifyFacts(factIds: string[]): void;
    /** Calculate current freshness of a fact */
    getFactFreshness(factId: string): number;
    get knowledgeUpdates(): number;
    private _upsertFact;
    private _calculateFreshness;
}
/** Factory function for KnowledgeEvolution */
export declare function createKnowledgeEvolution(config?: Partial<KnowledgeEvolutionConfig>): KnowledgeEvolution;
//# sourceMappingURL=knowledge_evolution.d.ts.map