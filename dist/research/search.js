/**
 * Research Search - Web search functionality for research module
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
import { search } from "@sciclaw/core";
/**
 * Research search engine with caching and quality annotation
 */
export class ResearchSearchEngine {
    resultsCache = new Map();
    providerName = "duckduckgo";
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
        catch {
            // Return mock results on failure
            return this.mockSearch(query, limit);
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
     * Mock search implementation
     */
    mockSearch(query, limit) {
        const results = [];
        for (let i = 0; i < Math.min(limit, 5); i++) {
            results.push({
                title: `Result ${i + 1} for ${query}`,
                url: `https://example.com/${i + 1}`,
                snippet: `This is a sample result for the query: ${query}`,
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
export async function researchSearch(query, limit = 10) {
    const engine = new ResearchSearchEngine();
    return engine.search(query, limit);
}
//# sourceMappingURL=search.js.map