export const DEFAULT_TOPIC_TRACKER_CONFIG = {
    decayRate: 0.005,
    minWeight: 0.1,
    maxTopics: 20,
    boostFactor: 0.15,
    relatedTopicsBoost: 0.05,
};
// ── Topic relations (simple built-in mapping) ──────────────────────────
const TOPIC_RELATIONS = {
    "ai": ["machine learning", "deep learning", "nlp", "computer vision"],
    "machine learning": ["ai", "deep learning", "data science", "statistics"],
    "deep learning": ["ai", "machine learning", "neural networks", "gpu"],
    "nlp": ["ai", "linguistics", "transformers", "llm"],
    "climate": ["environment", "energy", "sustainability", "policy"],
    "energy": ["climate", "renewable", "solar", "battery"],
    "blockchain": ["crypto", "defi", "web3", "distributed systems"],
    "security": ["cybersecurity", "encryption", "privacy", "network"],
    "cloud": ["aws", "kubernetes", "devops", "infrastructure"],
    "database": ["sql", "nosql", "data engineering", "storage"],
    "frontend": ["react", "vue", "typescript", "css"],
    "backend": ["api", "microservices", "golang", "rust"],
};
// ── Topic Tracker ──────────────────────────────────────────────────────
export class TopicTracker {
    config;
    interests = new Map();
    constructor(config) {
        this.config = { ...DEFAULT_TOPIC_TRACKER_CONFIG, ...config };
    }
    /** Record a research topic, boosting its weight */
    recordResearch(topic) {
        const normalized = topic.toLowerCase().trim();
        let interest = this.interests.get(normalized);
        if (interest) {
            interest.frequency++;
            interest.weight = Math.min(1, interest.weight + this.config.boostFactor);
            interest.lastResearched = new Date();
        }
        else {
            interest = {
                topic: normalized,
                weight: this.config.boostFactor,
                lastResearched: new Date(),
                frequency: 1,
                relatedTopics: this._findRelated(normalized),
            };
        }
        // Boost related topics slightly
        for (const related of interest.relatedTopics) {
            this._boostRelated(related);
        }
        // Enforce max topics
        this.interests.set(normalized, interest);
        this._enforceMaxTopics();
        return interest;
    }
    /** Apply time-based decay to all interests */
    applyDecay() {
        const now = Date.now();
        for (const [topic, interest] of this.interests) {
            const daysSince = (now - interest.lastResearched.getTime()) / (1000 * 60 * 60 * 24);
            const decay = daysSince * this.config.decayRate;
            interest.weight = Math.max(0, interest.weight - decay);
            // Remove if below threshold
            if (interest.weight < this.config.minWeight) {
                this.interests.delete(topic);
            }
        }
    }
    /** Get all tracked interests sorted by weight */
    getInterests() {
        this.applyDecay();
        return Array.from(this.interests.values()).sort((a, b) => b.weight - a.weight);
    }
    /** Get top N interests */
    getTopInterests(n = 5) {
        return this.getInterests().slice(0, n);
    }
    /** Get interest for a specific topic */
    getInterest(topic) {
        return this.interests.get(topic.toLowerCase().trim());
    }
    /** Suggest related topics the user hasn't researched yet */
    suggestTopics(n = 3) {
        const researched = new Set(this.interests.keys());
        const candidates = new Map(); // topic → score
        for (const interest of this.interests.values()) {
            for (const related of interest.relatedTopics) {
                if (researched.has(related))
                    continue;
                const score = (candidates.get(related) ?? 0) + interest.weight;
                candidates.set(related, score);
            }
        }
        return Array.from(candidates.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, n)
            .map(([topic]) => topic);
    }
    /** Get interest diversity score (0-1, higher = more diverse) */
    getDiversityScore() {
        this.applyDecay();
        if (this.interests.size <= 1)
            return 0;
        const weights = Array.from(this.interests.values()).map((i) => i.weight);
        const maxWeight = Math.max(...weights);
        if (maxWeight === 0)
            return 0;
        // How evenly distributed are the weights?
        const avgWeight = weights.reduce((s, w) => s + w, 0) / weights.length;
        return Math.min(1, avgWeight / maxWeight);
    }
    /** Clear all tracked interests */
    clear() {
        this.interests.clear();
    }
    get trackedCount() {
        return this.interests.size;
    }
    // ── Private ──────────────────────────────────────────────────────────
    _findRelated(topic) {
        // Direct lookup
        if (TOPIC_RELATIONS[topic])
            return [...TOPIC_RELATIONS[topic]];
        // Partial match
        for (const [key, related] of Object.entries(TOPIC_RELATIONS)) {
            if (topic.includes(key) || key.includes(topic)) {
                return related.filter((r) => r !== topic);
            }
        }
        return [];
    }
    _boostRelated(topic) {
        const interest = this.interests.get(topic);
        if (interest) {
            interest.weight = Math.min(1, interest.weight + this.config.relatedTopicsBoost);
        }
    }
    _enforceMaxTopics() {
        if (this.interests.size <= this.config.maxTopics)
            return;
        const sorted = Array.from(this.interests.entries()).sort((a, b) => a[1].weight - b[1].weight);
        const toRemove = sorted.slice(0, this.interests.size - this.config.maxTopics);
        for (const [topic] of toRemove) {
            this.interests.delete(topic);
        }
    }
}
/** Factory */
export function createTopicTracker(config) {
    return new TopicTracker(config);
}
//# sourceMappingURL=topic_tracker.js.map