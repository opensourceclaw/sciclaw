/**
 * DeepClaw v3.0.0 — Hypothesis Ranker
 *
 * Multi-factor hypothesis ranking with configurable weights.
 */
import { EvidenceStrength, DEFAULT_HYPOTHESIS_CONFIG } from "./types.js";
// ── Helpers ──────────────────────────────────────────────────────────────
function extractKeyTerms(text) {
    return text
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3);
}
function jaccardSimilarity(a, b) {
    const setA = new Set(a);
    const setB = new Set(b);
    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return union.size === 0 ? 0 : intersection.size / union.size;
}
function normalizeWeights(weights) {
    const sum = weights.evidenceSupport +
        weights.evidenceReliability +
        weights.novelty +
        weights.testability +
        weights.coherence;
    if (sum === 0)
        return { ...DEFAULT_HYPOTHESIS_CONFIG.rankingWeights };
    return {
        evidenceSupport: weights.evidenceSupport / sum,
        evidenceReliability: weights.evidenceReliability / sum,
        novelty: weights.novelty / sum,
        testability: weights.testability / sum,
        coherence: weights.coherence / sum,
    };
}
function computeEvidenceSupport(h) {
    const total = h.supportingEvidence.length + h.contradictingEvidence.length;
    if (total === 0)
        return 0.5;
    return h.supportingEvidence.length / total;
}
function computeEvidenceReliability(h) {
    const all = [...h.supportingEvidence, ...h.contradictingEvidence];
    if (all.length === 0)
        return 0.5;
    return all.reduce((s, e) => s + e.reliability, 0) / all.length;
}
function computeNovelty(h, all) {
    const terms = extractKeyTerms(h.statement);
    if (terms.length === 0)
        return 0.5;
    let maxSimilarity = 0;
    for (const other of all) {
        if (other.id === h.id)
            continue;
        const otherTerms = extractKeyTerms(other.statement);
        maxSimilarity = Math.max(maxSimilarity, jaccardSimilarity(terms, otherTerms));
    }
    return 1.0 - maxSimilarity;
}
function computeTestability(statement) {
    let score = 0.3;
    if (/\d+%/.test(statement))
        score += 0.2;
    if (/more than|less than|greater|higher|lower/i.test(statement))
        score += 0.15;
    if (/causes?|affects?|influences?|leads? to/i.test(statement))
        score += 0.15;
    if (/predicts?|forecasts?/i.test(statement))
        score += 0.1;
    if (statement.includes("?"))
        score -= 0.2;
    return Math.min(Math.max(score, 0), 1.0);
}
function computeCoherence(h) {
    let score = 0.7;
    const stmt = h.statement.toLowerCase();
    if (h.supportingEvidence.length > 0 && h.contradictingEvidence.length === 0)
        score += 0.15;
    if (h.supportingEvidence.length >= 3)
        score += 0.1;
    if (stmt.length < 10)
        score -= 0.3;
    if (stmt.length > 500)
        score -= 0.1;
    return Math.min(Math.max(score, 0), 1.0);
}
function strengthLabel(score) {
    if (score >= 0.8)
        return EvidenceStrength.STRONG;
    if (score >= 0.5)
        return EvidenceStrength.MODERATE;
    if (score >= 0.3)
        return EvidenceStrength.WEAK;
    return EvidenceStrength.NEGLIGIBLE;
}
// ── HypothesisRanker ─────────────────────────────────────────────────────
export class HypothesisRanker {
    weights;
    constructor(config) {
        const merged = { ...DEFAULT_HYPOTHESIS_CONFIG, ...config };
        this.weights = normalizeWeights(merged.rankingWeights);
    }
    rank(hypotheses) {
        if (hypotheses.length === 0)
            return [];
        const scored = hypotheses.map((h, _idx, all) => {
            const evidenceSupport = computeEvidenceSupport(h);
            const evidenceReliability = computeEvidenceReliability(h);
            const novelty = computeNovelty(h, all);
            const testability = computeTestability(h.statement);
            const coherence = computeCoherence(h);
            const score = this.weights.evidenceSupport * evidenceSupport +
                this.weights.evidenceReliability * evidenceReliability +
                this.weights.novelty * novelty +
                this.weights.testability * testability +
                this.weights.coherence * coherence;
            return { hypothesis: h, score };
        });
        // Stable sort by score descending
        const sorted = [...scored].sort((a, b) => b.score - a.score);
        return sorted.map((item, idx) => ({
            hypothesis: item.hypothesis,
            rank: idx + 1,
            score: Math.round(item.score * 100) / 100,
            confidence: item.hypothesis.confidence,
            strengthLabel: strengthLabel(item.score),
        }));
    }
    rankByConfidence(hypotheses) {
        const sorted = [...hypotheses].sort((a, b) => b.confidence - a.confidence);
        return sorted.map((h, idx) => ({
            hypothesis: h,
            rank: idx + 1,
            score: h.confidence,
            confidence: h.confidence,
            strengthLabel: strengthLabel(h.confidence),
        }));
    }
    rankByEvidenceStrength(hypotheses) {
        const scored = hypotheses.map((h) => ({
            hypothesis: h,
            score: computeEvidenceSupport(h),
        }));
        const sorted = [...scored].sort((a, b) => b.score - a.score);
        return sorted.map((item, idx) => ({
            hypothesis: item.hypothesis,
            rank: idx + 1,
            score: Math.round(item.score * 100) / 100,
            confidence: item.hypothesis.confidence,
            strengthLabel: strengthLabel(item.score),
        }));
    }
    rankByNovelty(hypotheses) {
        const scored = hypotheses.map((h) => ({
            hypothesis: h,
            score: computeNovelty(h, hypotheses),
        }));
        const sorted = [...scored].sort((a, b) => b.score - a.score);
        return sorted.map((item, idx) => ({
            hypothesis: item.hypothesis,
            rank: idx + 1,
            score: Math.round(item.score * 100) / 100,
            confidence: item.hypothesis.confidence,
            strengthLabel: strengthLabel(item.score),
        }));
    }
    getTopK(hypotheses, k) {
        const ranked = this.rank(hypotheses);
        return ranked.slice(0, Math.min(k, ranked.length));
    }
    getRankingWeights() {
        return { ...this.weights };
    }
}
export function createHypothesisRanker(config) {
    return new HypothesisRanker(config);
}
//# sourceMappingURL=ranker.js.map