/**
 * Feedback Processor - Converts user feedback into actionable adjustments
 */
import type { UserFeedback, ProcessedFeedback } from './types.js';
export declare class FeedbackProcessor {
    process(feedback: UserFeedback): ProcessedFeedback;
    processBatch(feedbacks: UserFeedback[]): ProcessedFeedback[];
    merge(processed: ProcessedFeedback[]): {
        action: ProcessedFeedback['action'];
        adjustments: string[];
        priority: number;
    };
    private generateAdjustments;
}
//# sourceMappingURL=processor.d.ts.map