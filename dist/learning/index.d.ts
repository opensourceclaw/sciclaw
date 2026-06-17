/**
 * DeepClaw v3.0.0-rc.1 — Learning Engine
 *
 * Unified learning engine implementing the LearningEngine interface.
 * Coordinates feedback learning, strategy optimization, and knowledge evolution.
 */
import type { LearningEngine, UserFeedback, ResearchHistory, Strategy, Fact, LearningMetrics } from "./types.js";
import { FeedbackLearner, type FeedbackLearnerConfig } from "./feedback_learner.js";
import { SelfImprover, type SelfImproverConfig } from "./self_improver.js";
import { KnowledgeEvolution, type KnowledgeEvolutionConfig } from "./knowledge_evolution.js";
export * from "./types.js";
export * from "./feedback_learner.js";
export * from "./self_improver.js";
export * from "./knowledge_evolution.js";
export interface DeepClawLearningConfig {
    feedback?: Partial<FeedbackLearnerConfig>;
    selfImprove?: Partial<SelfImproverConfig>;
    knowledge?: Partial<KnowledgeEvolutionConfig>;
}
export declare class DeepClawLearningEngine implements LearningEngine {
    private feedbackLearner;
    private selfImprover;
    private knowledgeEvolution;
    constructor(config?: DeepClawLearningConfig);
    learnFromFeedback(feedback: UserFeedback[]): Promise<void>;
    optimizeStrategy(history: ResearchHistory): Promise<Strategy>;
    updateKnowledge(newFacts: Fact[]): Promise<void>;
    getLearningMetrics(): LearningMetrics;
    /** Get the feedback learner for direct access */
    getFeedbackLearner(): FeedbackLearner;
    /** Get the self improver for direct access */
    getSelfImprover(): SelfImprover;
    /** Get the knowledge evolution manager for direct access */
    getKnowledgeEvolution(): KnowledgeEvolution;
}
/** Factory function for the learning engine */
export declare function createLearningEngine(config?: DeepClawLearningConfig): DeepClawLearningEngine;
//# sourceMappingURL=index.d.ts.map