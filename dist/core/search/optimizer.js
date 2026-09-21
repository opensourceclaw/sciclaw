// ── In-flight request deduplication ────────────────────────────────────
const inFlightRequests = new Map();
function inflightKey(query, engines) {
    return `${engines.sort().join(",")}:${query}`;
}
// ── Search Optimizer ───────────────────────────────────────────────────
export class SearchOptimizer {
    maxBatchSize;
    warmCache = new Map();
    constructor(maxBatchSize = 5) {
        this.maxBatchSize = maxBatchSize;
    }
    /**
     * Execute search with request deduplication.
     * If the same query+engines is already in-flight, reuse the promise.
     */
    async deduplicatedSearch(query, engines, searchFn) {
        const key = inflightKey(query, engines);
        const existing = inFlightRequests.get(key);
        if (existing)
            return existing;
        const promise = searchFn(query, engines).finally(() => {
            inFlightRequests.delete(key);
        });
        inFlightRequests.set(key, promise);
        return promise;
    }
    /**
     * Batch multiple queries for concurrent execution.
     * Limits concurrency to maxBatchSize to avoid rate limiting.
     */
    async batchSearch(queries, engines, searchFn) {
        const results = new Map();
        // Process in batches of maxBatchSize
        for (let i = 0; i < queries.length; i += this.maxBatchSize) {
            const batch = queries.slice(i, i + this.maxBatchSize);
            const batchResults = await Promise.all(batch.map((q) => this.deduplicatedSearch(q, engines, searchFn).then((r) => [q, r])));
            for (const [q, r] of batchResults) {
                results.set(q, r);
            }
        }
        return results;
    }
    /**
     * Warm cache with predicted queries based on research topic.
     */
    predictQueries(topic) {
        const patterns = [
            `${topic} overview`,
            `${topic} latest developments`,
            `${topic} key findings`,
            `${topic} future trends`,
            `${topic} challenges`,
        ];
        return patterns;
    }
    /**
     * Normalize URLs for better deduplication.
     */
    static normalizeUrl(url) {
        return url
            .replace(/^https?:\/\//i, "")
            .replace(/^www\./i, "")
            .replace(/\/+$/, "")
            .toLowerCase();
    }
    /**
     * Optimized deduplication with URL normalization.
     */
    static deduplicateResults(results) {
        const seen = new Set();
        return results.filter((r) => {
            const normalized = SearchOptimizer.normalizeUrl(r.url);
            if (seen.has(normalized))
                return false;
            seen.add(normalized);
            return true;
        });
    }
    /** Get in-flight request count */
    get inFlightCount() {
        return inFlightRequests.size;
    }
}
/** Factory */
export function createSearchOptimizer(maxBatchSize) {
    return new SearchOptimizer(maxBatchSize);
}
//# sourceMappingURL=optimizer.js.map