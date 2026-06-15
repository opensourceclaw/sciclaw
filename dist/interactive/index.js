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
const DEFAULT_CONFIG = {
    feedback: { enabled: true, timeoutMs: 30000, maxHistory: 100 },
    queryOptimizer: { enabled: true, maxExpansions: 5, dedupThreshold: 0.8 },
    progressive: { enabled: true, maxSections: 10, parallelBuild: false },
    visualization: { enabled: true, refreshIntervalMs: 1000 },
};
export class InteractiveEngine {
    feedbackCollector;
    feedbackProcessor;
    queryRewriter;
    queryExpander;
    queryScheduler;
    segmenter;
    builder;
    previewGenerator;
    progressTracker;
    statusDisplay;
    config;
    constructor(config) {
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
    async run(topic, options) {
        const startTime = Date.now();
        this.statusDisplay.record('idle', `Starting interactive research: ${topic}`);
        // Segment
        const sections = this.segmenter.segment(topic, options?.outline);
        this.progressTracker.reset(sections.length);
        this.statusDisplay.record('building_section', `Segmented into ${sections.length} sections`);
        // Process initial feedbacks if provided
        const feedbackHistory = [...(options?.feedbacks ?? [])];
        for (const fb of feedbackHistory) {
            this.feedbackCollector.collect(fb.type, fb.content, fb.target);
        }
        // Build sections
        const sectionResults = [];
        for (const section of sections) {
            this.progressTracker.setStatus('building_section', `Building: ${section.title}`);
            let result;
            try {
                result = await this.builder.build(section);
            }
            catch {
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
    collectFeedback(type, content, target) {
        return this.feedbackCollector.collect(type, content, target);
    }
    async processFeedback(feedback) {
        return this.feedbackProcessor.process(feedback);
    }
    async optimizeQueries(queries, feedbacks) {
        let results = queries.map((q) => ({
            id: Math.random().toString(36).slice(2, 10),
            text: q,
            priority: 0.5,
            status: 'pending',
            source: 'original',
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
                    status: 'pending',
                    source: 'rewritten',
                    parentId: queries[0],
                    createdAt: new Date(),
                })),
            ];
            for (const q of queries) {
                const expanded = this.queryExpander.expand(q);
                results = [
                    ...results,
                    ...expanded.expansions.map((e) => ({
                        id: Math.random().toString(36).slice(2, 10),
                        text: e,
                        priority: 0.4,
                        status: 'pending',
                        source: 'expanded',
                        parentId: q,
                        createdAt: new Date(),
                    })),
                ];
            }
        }
        const scheduled = this.queryScheduler.schedule(results);
        return scheduled.ordered;
    }
    async buildSection(section) {
        return this.builder.build(section);
    }
    getPreview() {
        return this.previewGenerator.generate(this.builder.getAllResults(), this.progressTracker.getProgress().totalTasks);
    }
    getProgress() {
        return this.progressTracker.getProgress();
    }
}
//# sourceMappingURL=index.js.map