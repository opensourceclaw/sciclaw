import type { Citation } from "./types.js";
export interface CitationStatistics {
    totalCitations: number;
    uniqueDomains: number;
    averageQuality: number;
    topDomains: Record<string, number>;
    dateRange: {
        earliest?: string;
        latest?: string;
    } | null;
}
export declare class CitationTracker {
    private citations;
    private urlIndex;
    addCitation(url: string, title?: string, qualityScore?: number, snippet?: string, publishedDate?: Date, author?: string, siteName?: string): Citation;
    getCitation(sourceId: string): Citation | undefined;
    getCitationByUrl(url: string): Citation | undefined;
    getAllCitations(): Citation[];
    getCitationsByDomain(domain: string): Citation[];
    getCitationsByQuality(minScore: number): Citation[];
    getStatistics(): CitationStatistics;
    removeCitation(sourceId: string): boolean;
    clear(): void;
    toJSON(): string;
    static fromJSON(json: string): CitationTracker;
}
//# sourceMappingURL=citation_tracker.d.ts.map