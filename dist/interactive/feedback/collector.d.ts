/**
 * Feedback Collector - Collects user feedback during research
 */
import type { UserFeedback, FeedbackType, FeedbackCollectorOptions } from './types.js';
export declare class FeedbackCollector {
    private history;
    private options;
    constructor(options?: Partial<FeedbackCollectorOptions>);
    collect(type: FeedbackType, content: string, target?: string): UserFeedback;
    collectBatch(inputs: Array<{
        type: FeedbackType;
        content: string;
        target?: string;
    }>): UserFeedback[];
    getHistory(limit?: number): UserFeedback[];
    getByType(type: FeedbackType): UserFeedback[];
    clear(): void;
    stats(): {
        total: number;
        byType: Record<string, number>;
    };
}
//# sourceMappingURL=collector.d.ts.map