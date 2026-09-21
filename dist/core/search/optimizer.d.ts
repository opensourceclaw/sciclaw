/**
 * SciClaw v3.0.0-rc.3 — Search Optimizer
 *
 * Request deduplication, batch search, and cache warming
 * for ≥30% search performance improvement.
 */
import type { SearchResult, SearchEngine } from "../types/index.js";
export declare class SearchOptimizer {
    private maxBatchSize;
    private warmCache;
    constructor(maxBatchSize?: number);
    /**
     * Execute search with request deduplication.
     * If the same query+engines is already in-flight, reuse the promise.
     */
    deduplicatedSearch(query: string, engines: SearchEngine[], searchFn: (q: string, e: SearchEngine[]) => Promise<SearchResult[]>): Promise<SearchResult[]>;
    /**
     * Batch multiple queries for concurrent execution.
     * Limits concurrency to maxBatchSize to avoid rate limiting.
     */
    batchSearch(queries: string[], engines: SearchEngine[], searchFn: (q: string, e: SearchEngine[]) => Promise<SearchResult[]>): Promise<Map<string, SearchResult[]>>;
    /**
     * Warm cache with predicted queries based on research topic.
     */
    predictQueries(topic: string): string[];
    /**
     * Normalize URLs for better deduplication.
     */
    static normalizeUrl(url: string): string;
    /**
     * Optimized deduplication with URL normalization.
     */
    static deduplicateResults(results: SearchResult[]): SearchResult[];
    /** Get in-flight request count */
    get inFlightCount(): number;
}
/** Factory */
export declare function createSearchOptimizer(maxBatchSize?: number): SearchOptimizer;
//# sourceMappingURL=optimizer.d.ts.map