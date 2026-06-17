/**
 * DeepClaw v3.0.0-rc.1 — Feedback Learner
 *
 * Learns from both explicit (ratings/comments) and implicit (pause/modify/refine)
 * user feedback. Extracts patterns and adjusts behavior accordingly.
 */
import type { UserFeedback, FeedbackPattern, ResearchHistory } from "./types.js";
export interface FeedbackLearnerConfig {
    minRatingForLearning: number;
    minFeedbackForPattern: number;
    decayFactor: number;
    implicitActionWeights: Record<string, number>;
}
export declare const DEFAULT_FEEDBACK_LEARNER_CONFIG: FeedbackLearnerConfig;
export declare class FeedbackLearner {
    private config;
    private feedbackStore;
    private patterns;
    private preferences;
    constructor(config?: Partial<FeedbackLearnerConfig>);
    /** Process and learn from user feedback */
    learnFromFeedback(feedback: UserFeedback[]): Promise<void>;
    /** Extract implicit feedback from user actions in research history */
    extractImplicitFeedback(history: ResearchHistory): UserFeedback[];
    /** Get detected feedback patterns */
    getPatterns(): FeedbackPattern[];
    /** Get learned topic preferences */
    getPreferences(): Map<string, number>;
    /** Recommend search depth based on learned preferences */
    recommendDepth(topic: string): "shallow" | "medium" | "deep";
    /** Recommend whether cross-domain analysis is desired for a topic */
    recommendCrossDomain(topic: string): boolean;
    get totalFeedback(): number;
    private _updatePatterns;
    private _updatePreferences;
    private _applyDecay;
    private _detectTrend;
    private _inferCategory;
}
/** Factory function for FeedbackLearner */
export declare function createFeedbackLearner(config?: Partial<FeedbackLearnerConfig>): FeedbackLearner;
//# sourceMappingURL=feedback_learner.d.ts.map