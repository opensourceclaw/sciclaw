export const DEFAULT_SELF_IMPROVER_CONFIG = {
    minSessionsForAdaptation: 3,
    adaptationThreshold: 0.05,
    maxAdaptationsPerSession: 3,
    errorPatternMinOccurrences: 2,
};
// ── Default Strategy ───────────────────────────────────────────────────
const DEFAULT_STRATEGY_PARAMS = {
    searchDepth: "medium",
    maxSources: 10,
    preferRecency: true,
    crossDomainEnabled: true,
    verificationRounds: 3,
    sourceQualityThreshold: 0.5,
};
// ── Self Improver ──────────────────────────────────────────────────────
export class SelfImprover {
    config;
    strategies = [];
    errorPatterns = new Map();
    historyScores = [];
    currentStrategy;
    constructor(config) {
        this.config = { ...DEFAULT_SELF_IMPROVER_CONFIG, ...config };
        this.currentStrategy = this._createInitialStrategy();
    }
    /** Optimize strategy based on research history */
    async optimizeStrategy(history) {
        const score = this._assessOutcome(history.outcome);
        this.historyScores.push(score);
        // Detect error patterns from failed stages
        this._detectErrorPatterns(history);
        // Only adapt after enough sessions
        if (this.historyScores.length < this.config.minSessionsForAdaptation) {
            return this.currentStrategy;
        }
        const trend = this._scoreTrend();
        if (trend === "declining" || score < 0.5) {
            this._adaptStrategy(history, score);
        }
        return this.currentStrategy;
    }
    /** Get current strategy */
    getStrategy() {
        return this.currentStrategy;
    }
    /** Get detected error patterns */
    getErrorPatterns() {
        return Array.from(this.errorPatterns.values())
            .filter((p) => p.occurrences >= this.config.errorPatternMinOccurrences)
            .sort((a, b) => b.occurrences - a.occurrences);
    }
    /** Self-assess accuracy based on recent outcomes */
    assessAccuracy() {
        if (this.historyScores.length === 0)
            return 1;
        const recent = this.historyScores.slice(-10);
        return recent.reduce((s, v) => s + v, 0) / recent.length;
    }
    /** Get accuracy trend over time */
    getAccuracyTrend() {
        return this.historyScores.slice(-20);
    }
    get strategyImprovements() {
        return this.currentStrategy.adaptations.length;
    }
    // ── Private ──────────────────────────────────────────────────────────
    _createInitialStrategy() {
        return {
            id: `strategy-${Date.now()}`,
            name: "default",
            parameters: { ...DEFAULT_STRATEGY_PARAMS },
            score: 0.5,
            adaptations: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
    _assessOutcome(outcome) {
        let score = 0;
        if (outcome.reportGenerated)
            score += 0.3;
        if (outcome.sourcesFound > 5)
            score += 0.2;
        else if (outcome.sourcesFound > 0)
            score += 0.1;
        if (outcome.userAccepted)
            score += 0.3;
        if (!outcome.userModified)
            score += 0.2;
        return Math.min(1, score);
    }
    _scoreTrend() {
        if (this.historyScores.length < 2)
            return "stable";
        const recent = this.historyScores.slice(-5);
        const prev = this.historyScores.slice(-10, -5);
        if (prev.length === 0)
            return "stable";
        const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
        const prevAvg = prev.reduce((s, v) => s + v, 0) / prev.length;
        const diff = recentAvg - prevAvg;
        if (diff > this.config.adaptationThreshold)
            return "improving";
        if (diff < -this.config.adaptationThreshold)
            return "declining";
        return "stable";
    }
    _adaptStrategy(history, score) {
        const adaptations = [];
        const failedStages = history.stages.filter((s) => !s.success);
        // Adapt search depth if search stage failed
        if (failedStages.some((s) => s.stage === "search")) {
            adaptations.push(this._makeAdaptation("searchDepth", this.currentStrategy.parameters.searchDepth, "deep", "Search stage failures detected"));
        }
        // Adapt max sources if few sources found
        if (history.outcome.sourcesFound < 3) {
            adaptations.push(this._makeAdaptation("maxSources", this.currentStrategy.parameters.maxSources, this.currentStrategy.parameters.maxSources + 5, "Low source count in recent research"));
        }
        // Disable cross-domain if it may be causing noise
        if (score < 0.3 && this.currentStrategy.parameters.crossDomainEnabled) {
            adaptations.push(this._makeAdaptation("crossDomainEnabled", true, false, "Cross-domain may add noise at low success rate"));
        }
        // Limit adaptations per session
        const applied = adaptations.slice(0, this.config.maxAdaptationsPerSession);
        for (const a of applied) {
            this.currentStrategy.parameters[a.parameter] = a.newValue;
            this.currentStrategy.adaptations.push(a);
        }
        this.currentStrategy.score = score;
        this.currentStrategy.updatedAt = new Date();
        this.strategies.push({ ...this.currentStrategy });
    }
    _makeAdaptation(parameter, oldValue, newValue, reason) {
        return { parameter, oldValue, newValue, reason, timestamp: new Date() };
    }
    _detectErrorPatterns(history) {
        for (const stage of history.stages) {
            if (!stage.success) {
                const key = `stage-failure:${stage.stage}`;
                const existing = this.errorPatterns.get(key);
                if (existing) {
                    existing.occurrences++;
                    existing.lastSeen = new Date();
                }
                else {
                    this.errorPatterns.set(key, {
                        id: key,
                        category: stage.stage,
                        description: `Stage "${stage.stage}" failures during research`,
                        occurrences: 1,
                        lastSeen: new Date(),
                        mitigation: this._suggestMitigation(stage.stage),
                    });
                }
            }
        }
    }
    _suggestMitigation(stage) {
        switch (stage) {
            case "search":
                return "Increase search depth or broaden query scope";
            case "analysis":
                return "Add more diverse sources for cross-referencing";
            case "synthesis":
                return "Reduce domain scope or increase verification rounds";
            case "report":
                return "Simplify output format or reduce section count";
            default:
                return "Review stage configuration";
        }
    }
}
/** Factory function for SelfImprover */
export function createSelfImprover(config) {
    return new SelfImprover(config);
}
//# sourceMappingURL=self_improver.js.map