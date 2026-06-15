/**
 * Learning Pipeline - Transforms user feedback into actionable learning rules
 *
 * Pipeline: Feedback → Analyze → Extract Patterns → Learn → Apply
 */
import { Feedback, LearningConfig, LearningResult } from './types.js';
export declare class LearningPipeline {
    private config;
    private clawRlAvailable;
    constructor(config?: Partial<LearningConfig>);
    private initClawRl;
    processFeedback(feedbacks: Feedback[], context?: Record<string, unknown>): LearningResult;
    processSingle(feedback: Feedback, context?: Record<string, unknown>): LearningResult;
    private filterFeedback;
    private analyzePatterns;
    private extractRules;
    private patternToRule;
    private bridgeToClawRl;
    private generateInsights;
}
export declare function processFeedback(feedbacks: Feedback[], context?: Record<string, unknown>): LearningResult;
//# sourceMappingURL=learning_pipeline.d.ts.map