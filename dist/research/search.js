/**
 * Research Search - Web search functionality for research module
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
import { search } from "../core/index.js";
/**
 * Research search engine with caching and quality annotation.
 *
 * GA-A2: failures are OBSERVABLE — the previous silent mock fallback is gone.
 * Synthetic results are produced only when `allowMock` is explicitly set
 * (mock mode / tests); otherwise a failed search throws with the cause.
 */
export class ResearchSearchEngine {
    resultsCache = new Map();
    providerName = "duckduckgo";
    allowMock;
    constructor(opts = {}) {
        this.allowMock = opts.allowMock ?? false;
    }
    /**
     * Search for results
     */
    async search(query, limit = 10) {
        const cacheKey = `${this.providerName}:${query}`;
        // Check cache
        const cached = this.resultsCache.get(cacheKey);
        if (cached) {
            return cached.slice(0, limit);
        }
        // Perform search using main search module
        try {
            const results = await search({
                query,
                maxResults: limit,
                useCache: true,
            });
            const researchResults = results.map(this.convertResult);
            // Cache results
            this.resultsCache.set(cacheKey, researchResults);
            return researchResults;
        }
        catch (error) {
            if (this.allowMock) {
                return this.mockSearch(query, limit);
            }
            throw new Error(`Search failed for "${query}": ${error instanceof Error ? error.message : String(error)}`, { cause: error });
        }
    }
    /**
     * Convert SearchResult to ResearchSearchResult
     */
    convertResult(r, index) {
        return {
            title: r.title,
            url: r.url,
            snippet: r.snippet,
            score: 1.0 - (index * 0.1),
            timestamp: new Date(),
            source: r.source,
        };
    }
    /**
     * Mock search implementation — explicit mock mode only, clearly labeled
     * (reserved `.invalid` URLs, source "mock").
     */
    mockSearch(query, limit) {
        const results = [];
        for (let i = 0; i < Math.min(limit, 5); i++) {
            results.push({
                title: `Mock result ${i + 1} for ${query}`,
                url: `https://mock.invalid/${i + 1}`,
                snippet: `Synthetic mock snippet for "${query}" — no real search was performed.`,
                score: 1.0 - (i * 0.2),
                timestamp: new Date(),
                source: "mock",
            });
        }
        return results;
    }
    /**
     * Clear the results cache
     */
    clearCache() {
        this.resultsCache.clear();
    }
    /**
     * Annotate results with quality scores
     */
    annotateQuality(results) {
        for (const result of results) {
            if (result.url) {
                const qualityScore = this.scoreUrl(result.url);
                result.qualityScore = qualityScore;
                result.qualityLabel = this.qualityLabel(qualityScore);
            }
        }
        return results;
    }
    /**
     * Simple URL-based quality scoring
     */
    scoreUrl(url) {
        try {
            const domain = new URL(url).hostname.replace("www.", "");
            // High quality domains
            const highQuality = [
                "wikipedia.org", "nature.com", "science.org", "arxiv.org",
                "scholar.google.com", "pubmed.gov", "ieee.org", "acm.org",
            ];
            // Medium quality domains
            const mediumQuality = [
                "medium.com", "stackoverflow.com", "github.com",
                "reddit.com", "quora.com", "news.ycombinator.com",
            ];
            if (highQuality.some((d) => domain.includes(d))) {
                return 0.85;
            }
            if (mediumQuality.some((d) => domain.includes(d))) {
                return 0.65;
            }
            return 0.5;
        }
        catch {
            return 0.3;
        }
    }
    /**
     * Get quality label
     */
    qualityLabel(score) {
        if (score >= 0.8)
            return "High Quality";
        if (score >= 0.6)
            return "Good";
        if (score >= 0.4)
            return "Average";
        return "Low Quality";
    }
    /**
     * Format search results with quality scores for display
     */
    static formatWithQuality(results) {
        const lines = [];
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (!result)
                continue;
            const qualityParts = [];
            if (result.qualityScore !== undefined && result.qualityScore !== null) {
                const qs = result.qualityScore;
                let indicator;
                if (qs >= 0.8)
                    indicator = "[High]";
                else if (qs >= 0.6)
                    indicator = "[Good]";
                else if (qs >= 0.4)
                    indicator = "[Avg]";
                else
                    indicator = "[Low]";
                qualityParts.push(` ${indicator}`);
            }
            lines.push(`${i + 1}. **${result.title}**\n` +
                `   URL: ${result.url}\n` +
                `   ${result.snippet}\n` +
                `   Score: ${result.score.toFixed(2)}${qualityParts.length ? " " + qualityParts.join(" ") : ""}\n`);
        }
        return lines.join("\n");
    }
}
/**
 * Search for results (convenience function)
 */
export async function researchSearch(query, limit = 10, opts = {}) {
    const engine = new ResearchSearchEngine(opts);
    return engine.search(query, limit);
}
//# sourceMappingURL=search.js.map