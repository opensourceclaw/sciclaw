/**
 * Research Search - Web search functionality for research module
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
import type { ResearchSearchResult } from "./types.js";
/**
 * Research search engine with caching and quality annotation.
 *
 * GA-A2: failures are OBSERVABLE — the previous silent mock fallback is gone.
 * Synthetic results are produced only when `allowMock` is explicitly set
 * (mock mode / tests); otherwise a failed search throws with the cause.
 */
export declare class ResearchSearchEngine {
    private resultsCache;
    private providerName;
    private allowMock;
    constructor(opts?: {
        allowMock?: boolean;
    });
    /**
     * Search for results
     */
    search(query: string, limit?: number): Promise<ResearchSearchResult[]>;
    /**
     * Convert SearchResult to ResearchSearchResult
     */
    private convertResult;
    /**
     * Mock search implementation — explicit mock mode only, clearly labeled
     * (reserved `.invalid` URLs, source "mock").
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
export declare function researchSearch(query: string, limit?: number, opts?: {
    allowMock?: boolean;
}): Promise<ResearchSearchResult[]>;
//# sourceMappingURL=search.d.ts.map