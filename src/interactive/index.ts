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

const DEFAULT_CONFIG: InteractiveConfig = {
  feedback: { enabled: true, timeoutMs: 30000, maxHistory: 100 },
  queryOptimizer: { enabled: true, maxExpansions: 5, dedupThreshold: 0.8 },
  progressive: { enabled: true, maxSections: 10, parallelBuild: false },
  visualization: { enabled: true, refreshIntervalMs: 1000 },
};

export class InteractiveEngine {
  public feedbackCollector: FeedbackCollector;
  public feedbackProcessor: FeedbackProcessor;
  public queryRewriter: QueryRewriter;
  public queryExpander: QueryExpander;
  public queryScheduler: QueryScheduler;
  public segmenter: SectionSegmenter;
  public builder: ProgressiveBuilder;
  public previewGenerator: PreviewGenerator;
  public progressTracker: ProgressTracker;
  public statusDisplay: StatusDisplay;
  private config: InteractiveConfig;

  constructor(config?: Partial<InteractiveConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.feedbackCollector = new FeedbackCollector(this.config.feedback);
    this.feedbackProcessor = new FeedbackProcessor();
    this.queryRewriter = new QueryRewriter();
    this.queryExpander = new QueryExpander();
    this.queryScheduler = new QueryScheduler();
    this.segmenter = new SectionSegmenter(this.config.progressive);
    this.builder = new ProgressiveBuilder();
    this.previewGenerator = new PreviewGenerator();
    this.progressTracker = new ProgressTracker(0);
    this.statusDisplay = new StatusDisplay();
  }

  async run(topic: string, options?: { outline?: string[]; feedbacks?: UserFeedback[] }): Promise<InteractiveResult> {
    const startTime = Date.now();

    this.statusDisplay.record('idle', `Starting interactive research: ${topic}`);

    // Segment
    const sections = this.segmenter.segment(topic, options?.outline);
    this.progressTracker.reset(sections.length);
    this.statusDisplay.record('building_section', `Segmented into ${sections.length} sections`);

    // Process initial feedbacks if provided
    const feedbackHistory: UserFeedback[] = [...(options?.feedbacks ?? [])];
    for (const fb of feedbackHistory) {
      this.feedbackCollector.collect(fb.type, fb.content, fb.target);
    }

    // Build sections
    const sectionResults: SectionResult[] = [];
    for (const section of sections) {
      this.progressTracker.setStatus('building_section', `Building: ${section.title}`);

      let result: SectionResult;
      try {
        result = await this.builder.build(section);
      } catch {
        result = {
          section: { ...section, status: 'failed' },
          content: '',
          wordCount: 0,
          durationMs: 0,
          confidence: 0,
          error: 'Build failed',
        };
      }

      sectionResults.push(result);
      this.progressTracker.update(1, section.title);
    }

    this.progressTracker.setStatus('completed', 'Research complete');
    this.statusDisplay.record('completed', `Completed ${sections.length} sections`);

    return {
      sections: sectionResults,
      progress: this.progressTracker.getProgress(),
      feedbackHistory,
      totalDurationMs: Date.now() - startTime,
    };
  }

  collectFeedback(type: FeedbackType, content: string, target?: string): UserFeedback {
    return this.feedbackCollector.collect(type, content, target);
  }

  async processFeedback(feedback: UserFeedback): Promise<ProcessedFeedback> {
    return this.feedbackProcessor.process(feedback);
  }

  async optimizeQueries(queries: string[], feedbacks?: ProcessedFeedback[]): Promise<Query[]> {
    let results: Query[] = queries.map((q) => ({
      id: Math.random().toString(36).slice(2, 10),
      text: q,
      priority: 0.5,
      status: 'pending' as const,
      source: 'original' as const,
      createdAt: new Date(),
    }));

    if (feedbacks && feedbacks.length > 0) {
      const rewritten = this.queryRewriter.rewriteBatch(queries, feedbacks);
      results = [
        ...results,
        ...rewritten
          .filter((r) => !queries.includes(r))
          .map((r) => ({
            id: Math.random().toString(36).slice(2, 10),
            text: r,
            priority: 0.6,
            status: 'pending' as const,
            source: 'rewritten' as const,
            parentId: queries[0],
            createdAt: new Date(),
          } as Query)),
      ];

      for (const q of queries) {
        const expanded = this.queryExpander.expand(q);
        results = [
          ...results,
          ...expanded.expansions.map((e) => ({
            id: Math.random().toString(36).slice(2, 10),
            text: e,
            priority: 0.4,
            status: 'pending' as const,
            source: 'expanded' as const,
            parentId: q,
            createdAt: new Date(),
          } as Query)),
        ];
      }
    }

    const scheduled = this.queryScheduler.schedule(results);
    return scheduled.ordered;
  }

  async buildSection(section: Section): Promise<SectionResult> {
    return this.builder.build(section);
  }

  getPreview(): ProgressPreview {
    return this.previewGenerator.generate(this.builder.getAllResults(), this.progressTracker.getProgress().totalTasks);
  }

  getProgress(): ResearchProgress {
    return this.progressTracker.getProgress();
  }
}
