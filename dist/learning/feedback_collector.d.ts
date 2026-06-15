/**
 * Feedback Collector - Collects and manages user feedback
 *
 * Supports programmatic feedback submission with integration to
 * claw-mem for persistent storage when available.
 */
import { Feedback, FeedbackType, FeedbackStats } from './types.js';
export declare class FeedbackCollector {
    private feedbacks;
    private storagePath?;
    private memoryEnabled;
    private memory;
    constructor(storagePath?: string);
    private initMemory;
    collectFeedback(feedbackType: FeedbackType, rating: number, topic?: string, comment?: string, metadata?: Record<string, unknown>): Feedback;
    collectFeedbackBatch(feedbacks: Array<{
        type: string;
        rating: number;
        topic?: string;
        comment?: string;
        metadata?: Record<string, unknown>;
    }>): Feedback[];
    getStatistics(): FeedbackStats;
    getFeedbacksByType(feedbackType: FeedbackType): Feedback[];
    getPositiveFeedbacks(): Feedback[];
    getNegativeFeedbacks(): Feedback[];
    exportFeedbacks(): string;
    getAllFeedbacks(): Feedback[];
    private storeFeedback;
}
export declare function collectFeedback(feedbackType?: FeedbackType, rating?: number, topic?: string, comment?: string): Feedback;
//# sourceMappingURL=feedback_collector.d.ts.map