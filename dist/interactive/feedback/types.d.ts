/**
 * Feedback types
 */
export type FeedbackType = 'positive' | 'negative' | 'modify' | 'supplement' | 'pause';
export interface UserFeedback {
    id: string;
    type: FeedbackType;
    content: string;
    target?: string;
    source: 'user' | 'system';
    timestamp: Date;
    metadata?: Record<string, unknown>;
}
export interface ProcessedFeedback {
    original: UserFeedback;
    action: 'continue' | 'redirect' | 'refine' | 'expand' | 'halt';
    priority: number;
    adjustments: string[];
    confidence: number;
}
export interface FeedbackCollectorOptions {
    timeoutMs: number;
    maxHistory: number;
    allowedTypes?: FeedbackType[];
}
//# sourceMappingURL=types.d.ts.map