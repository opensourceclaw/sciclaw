import { createFeedbackLearner, } from "./feedback_learner.js";
import { createSelfImprover, } from "./self_improver.js";
import { createKnowledgeEvolution, } from "./knowledge_evolution.js";
export * from "./types.js";
export * from "./feedback_learner.js";
export * from "./self_improver.js";
export * from "./knowledge_evolution.js";
// ── DeepClaw Learning Engine ───────────────────────────────────────────
export class DeepClawLearningEngine {
    feedbackLearner;
    selfImprover;
    knowledgeEvolution;
    constructor(config) {
        this.feedbackLearner = createFeedbackLearner(config?.feedback);
        this.selfImprover = createSelfImprover(config?.selfImprove);
        this.knowledgeEvolution = createKnowledgeEvolution(config?.knowledge);
    }
    async learnFromFeedback(feedback) {
        await this.feedbackLearner.learnFromFeedback(feedback);
    }
    async optimizeStrategy(history) {
        // Extract implicit feedback first
        const implicit = this.feedbackLearner.extractImplicitFeedback(history);
        if (implicit.length > 0) {
            await this.feedbackLearner.learnFromFeedback(implicit);
        }
        return this.selfImprover.optimizeStrategy(history);
    }
    async updateKnowledge(newFacts) {
        await this.knowledgeEvolution.updateKnowledge(newFacts);
    }
    getLearningMetrics() {
        return {
            totalFeedback: this.feedbackLearner.totalFeedback,
            strategyImprovements: this.selfImprover.strategyImprovements,
            knowledgeUpdates: this.knowledgeEvolution.knowledgeUpdates,
            accuracyTrend: this.selfImprover.getAccuracyTrend(),
            topErrorPatterns: this.selfImprover.getErrorPatterns(),
            freshnessReport: this.knowledgeEvolution.getFreshnessReport(),
        };
    }
    /** Get the feedback learner for direct access */
    getFeedbackLearner() {
        return this.feedbackLearner;
    }
    /** Get the self improver for direct access */
    getSelfImprover() {
        return this.selfImprover;
    }
    /** Get the knowledge evolution manager for direct access */
    getKnowledgeEvolution() {
        return this.knowledgeEvolution;
    }
}
/** Factory function for the learning engine */
export function createLearningEngine(config) {
    return new DeepClawLearningEngine(config);
}
//# sourceMappingURL=index.js.map