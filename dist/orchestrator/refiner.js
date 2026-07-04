import { ResearchStrategy } from "./types.js";
const DEFAULT_CONFIG = {
    maxRefinedQueries: 5,
    minExpectedGain: 0.1,
};
// ── Query rewriting templates ─────────────────────────────────────────
const REWRITE_TEMPLATES = {
    uncovered: (q, gap) => `${q} ${gap}`,
    contradiction: (_q, gap) => `verify: ${gap}`,
    shallow: (_q, gap) => `${gap} multiple sources`,
    stale: (_q, gap) => `latest ${gap} 2026`,
};
const SYNONYM_PAIRS = [
    ["analysis", "evaluation"],
    ["report", "study"],
    ["trends", "patterns"],
    ["market", "industry"],
    ["revenue", "earnings"],
    ["growth", "expansion"],
    ["strategy", "approach"],
    ["impact", "effect"],
];
// ── Refiner ──────────────────────────────────────────────────────────
export class IterativeRefiner {
    config;
    constructor(config) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    refine(context) {
        const gaps = context.blindSpots;
        const lowConfidenceClaims = context.claims.filter((c) => c.confidence < context.minConfidence);
        const newQueries = [];
        // Generate queries from blind spots
        for (const gap of this.prioritizeGaps(gaps)) {
            if (newQueries.length >= this.config.maxRefinedQueries)
                break;
            for (const sq of gap.suggestedQueries.slice(0, 2)) {
                if (newQueries.length >= this.config.maxRefinedQueries)
                    break;
                newQueries.push(sq);
            }
        }
        // Generate queries from low-confidence claims
        for (const claim of lowConfidenceClaims.slice(0, 2)) {
            if (newQueries.length >= this.config.maxRefinedQueries)
                break;
            newQueries.push(`${claim.claim.slice(0, 80)} authoritative source`);
        }
        // If we still have room, add synonym-expanded queries
        if (newQueries.length < this.config.maxRefinedQueries) {
            const synonymQueries = this.expandWithSynonyms(context.originalQuery);
            newQueries.push(...synonymQueries.slice(0, this.config.maxRefinedQueries - newQueries.length));
        }
        const expectedGain = this.estimateGain(gaps, lowConfidenceClaims);
        return {
            newQueries,
            adjustedStrategy: this.suggestStrategy(gaps),
            reason: this.buildReason(gaps, lowConfidenceClaims),
            expectedGain: Math.round(expectedGain * 100) / 100,
        };
    }
    /**
     * Decides whether the research loop should continue.
     * Returns false when no meaningful gaps remain or max iterations reached.
     */
    shouldContinue(context) {
        if (context.iteration >= context.maxIterations)
            return false;
        const highPriorityGaps = context.blindSpots.filter((b) => b.priority > 0.5);
        const unresolved = context.claims.filter((c) => c.status === "unverified");
        return (highPriorityGaps.length > 0 ||
            unresolved.length > 0);
    }
    // ── Private helpers ────────────────────────────────────────────────
    prioritizeGaps(gaps) {
        return [...gaps].sort((a, b) => b.priority - a.priority);
    }
    expandWithSynonyms(originalQuery) {
        const result = [];
        for (const [original, synonym] of SYNONYM_PAIRS) {
            if (originalQuery.toLowerCase().includes(original)) {
                result.push(originalQuery.replace(new RegExp(original, "i"), synonym));
            }
        }
        return result.slice(0, 3);
    }
    estimateGain(gaps, lowConfClaims) {
        const gapPriority = gaps.reduce((sum, g) => sum + g.priority, 0);
        const claimCount = lowConfClaims.length;
        const total = gaps.length + claimCount;
        return total > 0
            ? (gapPriority + claimCount) / (total * 2)
            : 0;
    }
    suggestStrategy(gaps) {
        if (gaps.some((g) => g.reason === "contradiction")) {
            return ResearchStrategy.TREE_SEARCH;
        }
        if (gaps.some((g) => g.reason === "uncovered")) {
            return ResearchStrategy.BREADTH_FIRST;
        }
        if (gaps.some((g) => g.reason === "stale")) {
            return ResearchStrategy.DEPTH_FIRST;
        }
        return undefined;
    }
    buildReason(gaps, lowConfClaims) {
        const parts = [];
        if (gaps.length > 0) {
            parts.push(`${gaps.length} blind spot(s)`);
        }
        if (lowConfClaims.length > 0) {
            parts.push(`${lowConfClaims.length} low-confidence claim(s)`);
        }
        return parts.length > 0
            ? `Refining: ${parts.join(", ")}`
            : "Refining: synonym expansion";
    }
}
export function createIterativeRefiner(config) {
    return new IterativeRefiner(config);
}
//# sourceMappingURL=refiner.js.map