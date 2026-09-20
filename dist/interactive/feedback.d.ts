/**
 * SciClaw v3.0.0 — Real-Time Feedback Handler
 *
 * Intent detection, sentiment analysis, and preference extraction
 * from user input in real time.
 */
import { FeedbackAction } from "./types.js";
import type { UserInput, UserPreference, SessionContext, FeedbackResult, InteractiveConfig } from "./types.js";
export declare class RealTimeFeedback {
    private config;
    private total;
    private acceptCount;
    private totalResponseTime;
    constructor(config?: Partial<InteractiveConfig>);
    processFeedback(sessionId: string, input: UserInput): FeedbackResult;
    batchProcess(inputs: UserInput[]): FeedbackResult[];
    analyzeSentiment(input: UserInput): "positive" | "negative" | "neutral";
    detectIntent(input: UserInput): FeedbackAction;
    extractPreferences(input: UserInput): UserPreference[];
    shouldAdapt(context: SessionContext): boolean;
    computeAdaptation(context: SessionContext, feedback: FeedbackResult[]): Partial<SessionContext>;
    getFeedbackStats(): {
        total: number;
        acceptRate: number;
        avgResponseTimeMs: number;
    };
}
export declare function createRealTimeFeedback(config?: Partial<InteractiveConfig>): RealTimeFeedback;
//# sourceMappingURL=feedback.d.ts.map