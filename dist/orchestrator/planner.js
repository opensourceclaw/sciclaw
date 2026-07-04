import { ResearchStrategy } from "./types.js";
const DEFAULT_CONFIG = {
    maxSubQueries: 5,
    minRelevanceThreshold: 0.3,
    pivotConfidenceDropThreshold: 0.4,
    allowedStrategies: [
        ResearchStrategy.BREADTH_FIRST,
        ResearchStrategy.DEPTH_FIRST,
        ResearchStrategy.TREE_SEARCH,
        ResearchStrategy.PIVOT,
    ],
};
// ── Decomposition patterns by strategy ────────────────────────────────
const DECOMPOSITION_PATTERNS = {
    [ResearchStrategy.BREADTH_FIRST]: (q) => [
        `${q} overview`,
        `${q} key aspects`,
        `${q} recent developments`,
        `${q} statistics data`,
    ],
    [ResearchStrategy.DEPTH_FIRST]: (q) => [
        `${q} detailed analysis`,
        `${q} technical deep dive`,
        `${q} expert opinions`,
    ],
    [ResearchStrategy.TREE_SEARCH]: (q) => [
        `${q} comparison`,
        `${q} alternatives`,
        `${q} pros and cons`,
        `${q} market analysis`,
    ],
    [ResearchStrategy.PIVOT]: (q) => [
        `${q} related topics`,
        `${q} adjacent areas`,
        `${q} contrasting perspectives`,
    ],
};
// ── Query type detection ─────────────────────────────────────────────
function detectQueryType(query) {
    const comparative = /\b(vs\.?|versus|compare|comparison|alternative|better|worse|pros?.cons)\b/i;
    const specific = /\b(how|what is|define|explain|specific|exact|precise)\b/i;
    const exploratory = /\b(overview|broad|general|landscape|trends?|market)\b/i;
    if (comparative.test(query))
        return ResearchStrategy.TREE_SEARCH;
    if (specific.test(query))
        return ResearchStrategy.DEPTH_FIRST;
    if (exploratory.test(query))
        return ResearchStrategy.BREADTH_FIRST;
    return ResearchStrategy.BREADTH_FIRST;
}
// ── Relevance scoring ────────────────────────────────────────────────
function scoreRelevance(result, query) {
    const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    const text = `${result.title} ${result.snippet}`.toLowerCase();
    const matchCount = queryTerms.filter((t) => text.includes(t)).length;
    return queryTerms.length > 0 ? matchCount / queryTerms.length : 0.5;
}
// ── Planner ──────────────────────────────────────────────────────────
export class DynamicPlanner {
    currentStrategy;
    config;
    constructor(config) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.currentStrategy = ResearchStrategy.BREADTH_FIRST;
    }
    decompose(query, context) {
        // Auto-select strategy based on query type
        this.currentStrategy = detectQueryType(query);
        // If context has prior iteration info, use the configured strategy
        if (context.config?.strategies?.[0]) {
            this.currentStrategy = context.config.strategies[0];
        }
        const patterns = DECOMPOSITION_PATTERNS[this.currentStrategy];
        const queries = patterns(query).slice(0, this.config.maxSubQueries);
        return queries.map((q, i) => ({
            id: crypto.randomUUID(),
            query: q,
            aspect: this.currentStrategy,
            sources: context.sources,
            priority: i === 0 ? 2 : 1,
        }));
    }
    selectStrategy(context) {
        return this.currentStrategy;
    }
    shouldPivot(context) {
        if (context.iteration === 0)
            return false;
        if (context.iteration >= context.maxIterations)
            return false;
        const signals = this.detectPivotSignals(context);
        return signals.length > 0;
    }
    onPivot(context) {
        const signals = this.detectPivotSignals(context);
        if (signals.length === 0)
            return [];
        // Switch to pivot strategy
        this.currentStrategy = ResearchStrategy.PIVOT;
        const topSignal = signals[0];
        // Generate new queries based on pivot signal
        const queries = DECOMPOSITION_PATTERNS[ResearchStrategy.PIVOT](context.originalQuery);
        return queries.slice(0, 3).map((q) => ({
            newQuery: `${q} (${topSignal.type.replace(/_/g, " ")})`,
        }));
    }
    // ── Pivot detection ────────────────────────────────────────────────
    detectPivotSignals(context) {
        const signals = [];
        // Signal 1: Low relevance — results don't match query
        const relevanceScores = context.results.map((r) => scoreRelevance(r, context.originalQuery));
        const avgRelevance = relevanceScores.length > 0
            ? relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length
            : 1;
        if (avgRelevance < this.config.minRelevanceThreshold) {
            signals.push({
                type: "low_relevance",
                confidence: 1 - avgRelevance,
                description: `Average relevance score ${avgRelevance.toFixed(2)} below threshold ${this.config.minRelevanceThreshold}`,
                suggestedAction: ResearchStrategy.PIVOT,
            });
        }
        // Signal 2: Contradictions — claims disagree
        const disputedCount = context.claims.filter((c) => c.status === "disputed").length;
        if (disputedCount > 1) {
            signals.push({
                type: "contradiction",
                confidence: Math.min(disputedCount / context.claims.length, 1),
                description: `${disputedCount} disputed claims detected`,
                suggestedAction: ResearchStrategy.TREE_SEARCH,
            });
        }
        // Signal 3: Information gain drop — diminishing returns
        if (context.iteration >= 2) {
            const confidenceDelta = context.iteration > 0 ? context.claims.length : 0;
            if (confidenceDelta < this.config.pivotConfidenceDropThreshold * 10) {
                signals.push({
                    type: "information_gain_drop",
                    confidence: 0.7,
                    description: `Low information gain in iteration ${context.iteration}`,
                    suggestedAction: ResearchStrategy.PIVOT,
                });
            }
        }
        // Signal 4: New aspects discovered — expand scope
        const blindSpotAspects = context.blindSpots
            .filter((b) => b.reason === "uncovered")
            .map((b) => b.aspect);
        if (blindSpotAspects.length > 0) {
            signals.push({
                type: "new_aspect",
                confidence: 0.8,
                description: `Uncovered aspects: ${blindSpotAspects.join(", ")}`,
                suggestedAction: ResearchStrategy.BREADTH_FIRST,
            });
        }
        return signals;
    }
    getCurrentStrategy() {
        return this.currentStrategy;
    }
}
export function createDynamicPlanner(config) {
    return new DynamicPlanner(config);
}
//# sourceMappingURL=planner.js.map