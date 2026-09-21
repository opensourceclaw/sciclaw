import { DEFAULT_INVALIDATION_CONFIG } from "./types.js";
const TOPIC_KEYWORDS = [
    "api", "bug", "config", "deploy", "design", "error", "fix",
    "performance", "security", "test", "typescript", "javascript",
    "python", "database", "cache", "docker", "kubernetes", "react",
    "node", "cli", "server", "client", "build", "ci/cd",
];
export class InvalidationManager {
    config;
    topicWindows = new Map();
    constructor(config = { ...DEFAULT_INVALIDATION_CONFIG }) {
        this.config = config;
    }
    computeTTL(params) {
        const base = params.baseTTLSeconds ?? this.config.defaultTTL;
        switch (this.config.strategy) {
            case "ttl":
                return base;
            case "topic_aware":
                return this.computeTopicTTL(params, base);
            case "source_aware":
                return this.computeSourceTTL(params, base);
            case "adaptive":
                return this.computeAdaptiveTTL(params, base);
        }
    }
    extractTopic(query) {
        const lower = query.toLowerCase();
        for (const kw of TOPIC_KEYWORDS) {
            if (lower.includes(kw))
                return kw;
        }
        return lower.slice(0, 30).replace(/\s+/g, "_");
    }
    invalidateByTopic(topic) {
        this.topicWindows.set(topic, Date.now());
    }
    invalidateBySource(_source) {
        // Mark source-level invalidation — callers should re-query
    }
    getConfig() {
        return { ...this.config };
    }
    computeTopicTTL(params, base) {
        const topic = this.extractTopic(params.query);
        const lastInvalidated = this.topicWindows.get(topic) ?? 0;
        const ageMs = Date.now() - lastInvalidated;
        if (ageMs < this.config.topicWindowMs) {
            return this.config.minTTL;
        }
        return base;
    }
    computeSourceTTL(params, base) {
        let ttl = base;
        for (const engine of params.engines) {
            const sourceTTL = this.config.sourceTTLs[engine];
            if (sourceTTL !== undefined) {
                ttl = Math.min(ttl, sourceTTL);
            }
        }
        return Math.max(ttl, this.config.minTTL);
    }
    computeAdaptiveTTL(params, base) {
        let ttl = base;
        const frequencyFactor = params.accessCount > 5 ? 0.7 : params.accessCount > 2 ? 0.85 : 1.0;
        const gapFactor = params.lastAccessGapMs > 3_600_000 ? 1.3 : 1.0;
        const sourceFactor = this.computeSourceFactor(params.engines);
        ttl = ttl * frequencyFactor * gapFactor * sourceFactor;
        const effectiveMin = Math.min(this.config.minTTL, base);
        return Math.round(Math.max(effectiveMin, Math.min(this.config.maxTTL, ttl)));
    }
    computeSourceFactor(engines) {
        let factor = 1.0;
        for (const engine of engines) {
            switch (engine) {
                case "duckduckgo":
                    factor *= 1.2;
                    break;
                case "google":
                    factor *= 0.8;
                    break;
                default:
                    break;
            }
        }
        return factor;
    }
}
//# sourceMappingURL=invalidation.js.map