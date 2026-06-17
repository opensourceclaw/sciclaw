export const DEFAULT_FEEDBACK_LEARNER_CONFIG = {
    minRatingForLearning: 3,
    minFeedbackForPattern: 3,
    decayFactor: 0.95,
    implicitActionWeights: {
        accept: 0.1,
        reject: -0.15,
        modify: -0.1,
        refine: -0.05,
        pause: 0,
    },
};
// ── Feedback Learner ───────────────────────────────────────────────────
export class FeedbackLearner {
    config;
    feedbackStore = [];
    patterns = new Map();
    preferences = new Map(); // topic → weight
    constructor(config) {
        this.config = { ...DEFAULT_FEEDBACK_LEARNER_CONFIG, ...config };
    }
    /** Process and learn from user feedback */
    async learnFromFeedback(feedback) {
        for (const fb of feedback) {
            this.feedbackStore.push(fb);
            this._updatePatterns(fb);
            if (fb.context?.topic) {
                this._updatePreferences(fb);
            }
        }
        // Apply decay to old feedback
        this._applyDecay();
    }
    /** Extract implicit feedback from user actions in research history */
    extractImplicitFeedback(history) {
        const implicit = [];
        for (const action of history.userActions) {
            const weight = this.config.implicitActionWeights[action.type];
            if (weight === undefined || weight === 0)
                continue;
            const sentiment = weight > 0 ? "positive" : "negative";
            implicit.push({
                id: `implicit-${history.sessionId}-${action.timestamp.getTime()}`,
                sessionId: history.sessionId,
                type: "implicit",
                sentiment,
                category: this._inferCategory(action),
                rating: sentiment === "positive" ? 4 : 2,
                context: { topic: history.topic },
                timestamp: action.timestamp,
            });
        }
        return implicit;
    }
    /** Get detected feedback patterns */
    getPatterns() {
        return Array.from(this.patterns.values());
    }
    /** Get learned topic preferences */
    getPreferences() {
        return new Map(this.preferences);
    }
    /** Recommend search depth based on learned preferences */
    recommendDepth(topic) {
        const pref = this.preferences.get(topic);
        if (pref === undefined)
            return "medium";
        if (pref > 0.6)
            return "deep";
        if (pref < 0.3)
            return "shallow";
        return "medium";
    }
    /** Recommend whether cross-domain analysis is desired for a topic */
    recommendCrossDomain(topic) {
        const pref = this.preferences.get(topic);
        return pref !== undefined && pref >= 0.5;
    }
    get totalFeedback() {
        return this.feedbackStore.length;
    }
    // ── Private ──────────────────────────────────────────────────────────
    _updatePatterns(fb) {
        let pattern = this.patterns.get(fb.category);
        if (!pattern) {
            pattern = {
                category: fb.category,
                frequency: 0,
                avgRating: 0,
                trend: "stable",
                recentFeedback: [],
            };
            this.patterns.set(fb.category, pattern);
        }
        pattern.frequency++;
        const total = pattern.avgRating * (pattern.frequency - 1) + fb.rating;
        pattern.avgRating = total / pattern.frequency;
        // Keep last 10 recent feedback
        pattern.recentFeedback.push(fb);
        if (pattern.recentFeedback.length > 10) {
            pattern.recentFeedback.shift();
        }
        // Detect trend from recent feedback
        pattern.trend = this._detectTrend(pattern.recentFeedback);
    }
    _updatePreferences(fb) {
        const topic = fb.context.topic;
        const current = this.preferences.get(topic) ?? 0.5;
        const delta = fb.sentiment === "positive" ? 0.1 : fb.sentiment === "negative" ? -0.1 : 0;
        this.preferences.set(topic, Math.max(0, Math.min(1, current + delta)));
    }
    _applyDecay() {
        for (const pattern of this.patterns.values()) {
            pattern.frequency = Math.max(0, Math.round(pattern.frequency * this.config.decayFactor));
        }
    }
    _detectTrend(recent) {
        if (recent.length < 2)
            return "stable";
        const mid = Math.floor(recent.length / 2);
        const firstHalf = recent.slice(0, mid);
        const secondHalf = recent.slice(mid);
        const firstAvg = firstHalf.reduce((s, f) => s + f.rating, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((s, f) => s + f.rating, 0) / secondHalf.length;
        const diff = secondAvg - firstAvg;
        if (diff > 0.3)
            return "improving";
        if (diff < -0.3)
            return "declining";
        return "stable";
    }
    _inferCategory(action) {
        switch (action.type) {
            case "reject":
                return "accuracy";
            case "modify":
            case "refine":
                return "completeness";
            case "accept":
                return "quality";
            default:
                return "usefulness";
        }
    }
}
/** Factory function for FeedbackLearner */
export function createFeedbackLearner(config) {
    return new FeedbackLearner(config);
}
//# sourceMappingURL=feedback_learner.js.map