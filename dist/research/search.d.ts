/**
 * Research Search - Web search functionality for research module
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
import type { ResearchSearchResult } from "./types.js";
/**
 * Research search engine with caching and quality annotation
 */
export declare class ResearchSearchEngine {
    private resultsCache;
    private providerName;
    /**
     * Search for results
     */
    search(query: string, limit?: number): Promise<ResearchSearchResult[]>;
    /**
     * Convert SearchResult to ResearchSearchResult
     */
    private convertResult;
    /**
     * Mock search implementation
     */
    private mockSearch;
    /**
     * Clear the results cache
     */
    clearCache(): void;
    /**
     * Annotate results with quality scores
     */
    annotateQuality(results: ResearchSearchResult[]): ResearchSearchResult[];
    /**
     * Simple URL-based quality scoring
     */
    private scoreUrl;
    /**
     * Get quality label
     */
    private qualityLabel;
    /**
     * Format search results with quality scores for display
     */
    static formatWithQuality(results: ResearchSearchResult[]): string;
}
/**
 * Search for results (convenience function)
 */
export declare function researchSearch(query: string, limit?: number): Promise<ResearchSearchResult[]>;
//# sourceMappingURL=search.d.ts.map