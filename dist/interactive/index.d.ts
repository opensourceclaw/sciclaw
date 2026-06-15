/**
 * InteractiveEngine - Main entry point for interactive research
 */
import { FeedbackCollector } from './feedback/collector.js';
import { FeedbackProcessor } from './feedback/processor.js';
import { QueryRewriter } from './query_optimizer/rewriter.js';
import { QueryExpander } from './query_optimizer/expander.js';
import { QueryScheduler } from './query_optimizer/scheduler.js';
import { SectionSegmenter } from './progressive/segmenter.js';
import { ProgressiveBuilder } from './progressive/builder.js';
import { PreviewGenerator } from './progressive/preview.js';
import { ProgressTracker } from './visualization/progress.js';
import { StatusDisplay } from './visualization/status.js';
import type { InteractiveConfig, InteractiveResult } from './types.js';
import type { FeedbackType, UserFeedback, ProcessedFeedback } from './feedback/types.js';
import type { Query } from './query_optimizer/types.js';
import type { Section, SectionResult, ProgressPreview } from './progressive/types.js';
import type { ResearchProgress } from './visualization/types.js';
export { FeedbackCollector } from './feedback/collector.js';
export { FeedbackProcessor } from './feedback/processor.js';
export { QueryRewriter } from './query_optimizer/rewriter.js';
export { QueryExpander } from './query_optimizer/expander.js';
export { QueryScheduler } from './query_optimizer/scheduler.js';
export { SectionSegmenter } from './progressive/segmenter.js';
export { ProgressiveBuilder } from './progressive/builder.js';
export { PreviewGenerator } from './progressive/preview.js';
export { ProgressTracker } from './visualization/progress.js';
export { StatusDisplay } from './visualization/status.js';
export type { InteractiveConfig, InteractiveResult } from './types.js';
export type { FeedbackType, UserFeedback, ProcessedFeedback } from './feedback/types.js';
export type { Query } from './query_optimizer/types.js';
export type { Section, SectionResult, ProgressPreview } from './progressive/types.js';
export type { ResearchProgress, ResearchStatus, StatusUpdate } from './visualization/types.js';
export declare class InteractiveEngine {
    feedbackCollector: FeedbackCollector;
    feedbackProcessor: FeedbackProcessor;
    queryRewriter: QueryRewriter;
    queryExpander: QueryExpander;
    queryScheduler: QueryScheduler;
    segmenter: SectionSegmenter;
    builder: ProgressiveBuilder;
    previewGenerator: PreviewGenerator;
    progressTracker: ProgressTracker;
    statusDisplay: StatusDisplay;
    private config;
    constructor(config?: Partial<InteractiveConfig>);
    run(topic: string, options?: {
        outline?: string[];
        feedbacks?: UserFeedback[];
    }): Promise<InteractiveResult>;
    collectFeedback(type: FeedbackType, content: string, target?: string): UserFeedback;
    processFeedback(feedback: UserFeedback): Promise<ProcessedFeedback>;
    optimizeQueries(queries: string[], feedbacks?: ProcessedFeedback[]): Promise<Query[]>;
    buildSection(section: Section): Promise<SectionResult>;
    getPreview(): ProgressPreview;
    getProgress(): ResearchProgress;
}
//# sourceMappingURL=index.d.ts.map