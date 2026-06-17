export const DEFAULT_KNOWLEDGE_EVOLUTION_CONFIG = {
    freshnessThresholdHigh: 0.9,
    freshnessThresholdLow: 0.5,
    freshnessDecayRate: 0.01, // 1% freshness decay per day
    maxFactVersions: 10,
    minConfidenceForFact: 0.3,
};
// ── Knowledge Evolution ────────────────────────────────────────────────
export class KnowledgeEvolution {
    config;
    facts = new Map();
    updateLog = [];
    constructor(config) {
        this.config = { ...DEFAULT_KNOWLEDGE_EVOLUTION_CONFIG, ...config };
    }
    /** Update knowledge base with new facts */
    async updateKnowledge(newFacts) {
        for (const fact of newFacts) {
            if (fact.confidence < this.config.minConfidenceForFact)
                continue;
            this._upsertFact(fact);
        }
    }
    /** Get freshness report for all facts */
    getFreshnessReport() {
        let fresh = 0;
        let stale = 0;
        let outdated = 0;
        for (const fact of this.facts.values()) {
            const f = this._calculateFreshness(fact);
            if (f >= this.config.freshnessThresholdHigh)
                fresh++;
            else if (f >= this.config.freshnessThresholdLow)
                stale++;
            else
                outdated++;
        }
        const total = this.facts.size || 1;
        return {
            totalFacts: this.facts.size,
            fresh,
            stale,
            outdated,
            freshnessRatio: fresh / total,
        };
    }
    /** Get outdated facts that need review */
    getOutdatedFacts() {
        const result = [];
        for (const fact of this.facts.values()) {
            const f = this._calculateFreshness(fact);
            if (f < this.config.freshnessThresholdLow) {
                result.push(fact);
            }
        }
        return result.sort((a, b) => this._calculateFreshness(a) - this._calculateFreshness(b));
    }
    /** Get facts by domain */
    getFactsByDomain(domain) {
        return Array.from(this.facts.values())
            .filter((f) => f.domain === domain)
            .sort((a, b) => b.confidence - a.confidence);
    }
    /** Get all facts */
    getAllFacts() {
        return Array.from(this.facts.values());
    }
    /** Get fact update history */
    getUpdateLog() {
        return [...this.updateLog];
    }
    /** Mark facts as verified (reset freshness) */
    verifyFacts(factIds) {
        for (const id of factIds) {
            const fact = this.facts.get(id);
            if (fact) {
                fact.lastVerified = new Date();
                fact.freshness = 1;
            }
        }
    }
    /** Calculate current freshness of a fact */
    getFactFreshness(factId) {
        const fact = this.facts.get(factId);
        if (!fact)
            return 0;
        return this._calculateFreshness(fact);
    }
    get knowledgeUpdates() {
        return this.updateLog.length;
    }
    // ── Private ──────────────────────────────────────────────────────────
    _upsertFact(newFact) {
        const existing = this.facts.get(newFact.id);
        if (!existing) {
            this.facts.set(newFact.id, { ...newFact, freshness: 1, version: 1 });
            this.updateLog.push({
                factId: newFact.id,
                field: "statement",
                oldValue: null,
                newValue: newFact.statement,
                reason: "new fact added",
                timestamp: new Date(),
            });
            return;
        }
        // Update existing fact
        if (existing.version >= this.config.maxFactVersions)
            return;
        const fields = [
            "statement",
            "confidence",
            "domain",
            "sources",
        ];
        for (const field of fields) {
            const oldVal = existing[field];
            const newVal = newFact[field];
            if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                this.updateLog.push({
                    factId: newFact.id,
                    field,
                    oldValue: oldVal,
                    newValue: newVal,
                    reason: "fact updated",
                    timestamp: new Date(),
                });
                existing[field] = newVal;
            }
        }
        existing.version++;
        existing.lastVerified = newFact.lastVerified;
        existing.freshness = 1; // Reset on update
    }
    _calculateFreshness(fact) {
        const daysSinceVerified = (Date.now() - fact.lastVerified.getTime()) / (1000 * 60 * 60 * 24);
        const decay = daysSinceVerified * this.config.freshnessDecayRate;
        return Math.max(0, fact.freshness - decay);
    }
}
/** Factory function for KnowledgeEvolution */
export function createKnowledgeEvolution(config) {
    return new KnowledgeEvolution(config);
}
//# sourceMappingURL=knowledge_evolution.js.map