import type { DomainScore, FreshnessScore, SourceScore } from "./types.js";
export declare class DomainScorer {
    scoreDomain(url: string): DomainScore;
}
export declare class FreshnessScorer {
    scoreFreshness(pubDate?: string, modDate?: string): FreshnessScore;
}
export declare class SourceScorer {
    private domainWeight;
    private freshnessWeight;
    private authorityWeight;
    private domainScorer;
    private freshnessScorer;
    constructor(weights?: {
        domain?: number;
        freshness?: number;
        authority?: number;
    });
    scoreSource(url: string, pubDate?: string, authorityScore?: number): SourceScore;
}
export declare function scoreSource(url: string, pubDate?: string): SourceScore;
//# sourceMappingURL=source_scorer.d.ts.map