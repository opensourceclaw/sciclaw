/**
 * DeepClaw v3.0.0 — Hypothesis Generator
 *
 * Evidence-based hypothesis generation with clustering and template expansion.
 */
import { HypothesisCategory, HypothesisStatus, DEFAULT_HYPOTHESIS_CONFIG } from "./types.js";
// ── Helpers ──────────────────────────────────────────────────────────────
function generateId() {
    return crypto.randomUUID();
}
function extractKeyTerms(text) {
    return text
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .filter((w) => !/^(this|that|these|those|with|from|have|been|were|they|about|their|which|would|there)$/.test(w));
}
function jaccardSimilarity(a, b) {
    const setA = new Set(a);
    const setB = new Set(b);
    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return union.size === 0 ? 0 : intersection.size / union.size;
}
function clusterEvidence(evidence) {
    const clusters = [];
    const assigned = new Set();
    for (const item of evidence) {
        if (assigned.has(item.id))
            continue;
        const cluster = [item];
        assigned.add(item.id);
        const terms = extractKeyTerms(item.content);
        for (const other of evidence) {
            if (assigned.has(other.id))
                continue;
            const otherTerms = extractKeyTerms(other.content);
            if (jaccardSimilarity(terms, otherTerms) > 0.3) {
                cluster.push(other);
                assigned.add(other.id);
            }
        }
        clusters.push(cluster);
    }
    return clusters;
}
// ── Statement Templates ──────────────────────────────────────────────────
const TEMPLATES = {
    [HypothesisCategory.CAUSAL]: [
        "{X} causes {Y}",
        "{X} leads to {Y}",
        "{X} influences {Y}",
    ],
    [HypothesisCategory.CORRELATIONAL]: [
        "{X} is associated with {Y}",
        "{X} correlates with {Y}",
    ],
    [HypothesisCategory.EXPLANATORY]: [
        "{X} explains {Y}",
        "{X} is the reason for {Y}",
    ],
    [HypothesisCategory.PREDICTIVE]: [
        "If {X} then {Y}",
        "{X} predicts {Y}",
    ],
    [HypothesisCategory.COMPARATIVE]: [
        "{X} is more significant than {Y}",
        "{X} has greater impact than {Y}",
    ],
};
function pickTerms(evidence) {
    const terms = new Set();
    for (const e of evidence) {
        const kt = extractKeyTerms(e.content);
        for (const t of kt.slice(0, 3))
            terms.add(t);
    }
    const arr = [...terms];
    return arr.length >= 2 ? arr.slice(0, 2) : [...arr, "unknown factor"];
}
function generateStatement(category, terms) {
    const templates = TEMPLATES[category];
    const template = templates[Math.floor(Math.random() * templates.length)];
    return template
        .replace("{X}", terms[0] ?? "Factor A")
        .replace("{Y}", terms[1] ?? "Factor B");
}
function determineCategory(evidence) {
    const combined = evidence.map((e) => e.content.toLowerCase()).join(" ");
    if (/causes?|leads? to|affects?|influences?/i.test(combined))
        return HypothesisCategory.CAUSAL;
    if (/correlates?|associated|linked|related/i.test(combined))
        return HypothesisCategory.CORRELATIONAL;
    if (/explains?|reason|because/i.test(combined))
        return HypothesisCategory.EXPLANATORY;
    if (/predicts?|will|forecast/i.test(combined))
        return HypothesisCategory.PREDICTIVE;
    if (/more|less|greater|better|worse|than/i.test(combined))
        return HypothesisCategory.COMPARATIVE;
    return HypothesisCategory.CAUSAL;
}
// ── HypothesisGenerator ──────────────────────────────────────────────────
export class HypothesisGenerator {
    config;
    totalGenerated = 0;
    totalRefined = 0;
    constructor(config) {
        this.config = { ...DEFAULT_HYPOTHESIS_CONFIG, ...config };
        if (this.config.minHypotheses > this.config.maxHypotheses) {
            this.config.minHypotheses = this.config.maxHypotheses;
        }
    }
    generate(evidence, context) {
        if (evidence.length === 0)
            return [];
        // Cluster evidence
        const clusters = clusterEvidence(evidence);
        const hypotheses = [];
        for (const cluster of clusters) {
            if (cluster.length < this.config.minEvidencePerHypothesis)
                continue;
            const category = determineCategory(cluster);
            const terms = pickTerms(cluster);
            // Generate one hypothesis per category per cluster
            const statement = generateStatement(category, terms);
            const avgRelevance = cluster.reduce((s, e) => s + e.relevance, 0) / cluster.length;
            const avgReliability = cluster.reduce((s, e) => s + e.reliability, 0) / cluster.length;
            const confidence = Math.min(avgRelevance * avgReliability, 0.9);
            hypotheses.push({
                id: generateId(),
                statement,
                category,
                supportingEvidence: cluster,
                contradictingEvidence: [],
                confidence: Math.round(confidence * 100) / 100,
                status: HypothesisStatus.PROPOSED,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
        // If not enough, generate cross-cluster hypotheses
        if (hypotheses.length < this.config.minHypotheses && clusters.length > 1) {
            for (let i = 0; i < clusters.length - 1 && hypotheses.length < this.config.minHypotheses; i++) {
                const merged = [...clusters[i], ...clusters[i + 1]];
                const category = determineCategory(merged);
                const terms = pickTerms(merged);
                const statement = generateStatement(category, terms);
                const avgRelevance = merged.reduce((s, e) => s + e.relevance, 0) / merged.length;
                const avgReliability = merged.reduce((s, e) => s + e.reliability, 0) / merged.length;
                hypotheses.push({
                    id: generateId(),
                    statement,
                    category,
                    supportingEvidence: merged,
                    contradictingEvidence: [],
                    confidence: Math.round(Math.min(avgRelevance * avgReliability, 0.9) * 100) / 100,
                    status: HypothesisStatus.PROPOSED,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
        }
        // If still not enough, generate from single evidence items
        while (hypotheses.length < this.config.minHypotheses && evidence.length > 0) {
            const idx = hypotheses.length % evidence.length;
            const item = evidence[idx];
            const category = determineCategory([item]);
            const terms = extractKeyTerms(item.content);
            const statement = generateStatement(category, terms.length >= 2 ? terms.slice(0, 2) : [item.content.slice(0, 20), "outcome"]);
            hypotheses.push({
                id: generateId(),
                statement,
                category,
                supportingEvidence: [item],
                contradictingEvidence: [],
                confidence: Math.round(Math.min(item.relevance * item.reliability, 0.9) * 100) / 100,
                status: HypothesisStatus.PROPOSED,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            // Respect maxHypotheses even in fallback
            if (hypotheses.length >= this.config.maxHypotheses)
                break;
        }
        // Cap at maxHypotheses
        const result = hypotheses
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, this.config.maxHypotheses);
        this.totalGenerated += result.length;
        return result;
    }
    refineHypothesis(hypothesis, newEvidence) {
        let confidence = hypothesis.confidence;
        const newSupporting = [...hypothesis.supportingEvidence];
        const newContradicting = [...hypothesis.contradictingEvidence];
        for (const ev of newEvidence) {
            if (ev.relevance > 0.5) {
                newSupporting.push(ev);
                confidence = Math.min(confidence + 0.05, 0.95);
            }
            else {
                newContradicting.push(ev);
                confidence = Math.max(confidence - 0.1, 0.05);
            }
        }
        let status = HypothesisStatus.INCONCLUSIVE;
        if (confidence >= 0.7)
            status = HypothesisStatus.SUPPORTED;
        else if (confidence < 0.3)
            status = HypothesisStatus.REFUTED;
        this.totalRefined++;
        return {
            ...hypothesis,
            supportingEvidence: newSupporting,
            contradictingEvidence: newContradicting,
            confidence: Math.round(confidence * 100) / 100,
            status,
            updatedAt: new Date(),
        };
    }
    combineHypotheses(h1, h2) {
        if (h1.id === h2.id)
            return { ...h1 };
        if (h1.category !== h2.category)
            return null;
        return {
            id: generateId(),
            statement: `${h1.statement}; additionally, ${h2.statement.charAt(0).toLowerCase() + h2.statement.slice(1)}`,
            category: h1.category,
            supportingEvidence: [
                ...h1.supportingEvidence,
                ...h2.supportingEvidence,
            ],
            contradictingEvidence: [
                ...h1.contradictingEvidence,
                ...h2.contradictingEvidence,
            ],
            confidence: Math.round(((h1.confidence + h2.confidence) / 2) * 100) / 100,
            status: HypothesisStatus.PROPOSED,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
    getStats() {
        return {
            totalGenerated: this.totalGenerated,
            totalRefined: this.totalRefined,
        };
    }
}
export function createHypothesisGenerator(config) {
    return new HypothesisGenerator(config);
}
//# sourceMappingURL=generator.js.map