/**
 * Interactive Module - Shared type definitions
 */
import type { UserFeedback } from './feedback/types.js';
import type { ResearchProgress } from './visualization/types.js';
import type { SectionResult } from './progressive/types.js';
export interface InteractiveConfig {
    feedback: {
        enabled: boolean;
        timeoutMs: number;
        maxHistory: number;
    };
    queryOptimizer: {
        enabled: boolean;
        maxExpansions: number;
        dedupThreshold: number;
    };
    progressive: {
        enabled: boolean;
        maxSections: number;
        parallelBuild: boolean;
    };
    visualization: {
        enabled: boolean;
        refreshIntervalMs: number;
    };
}
export interface InteractiveResult {
    sections: SectionResult[];
    progress: ResearchProgress;
    feedbackHistory: UserFeedback[];
    totalDurationMs: number;
}
export type InteractiveEvent = {
    type: 'feedback_received';
    feedback: UserFeedback;
} | {
    type: 'query_optimized';
    original: string;
    rewritten: string[];
} | {
    type: 'section_completed';
    sectionIndex: number;
    title: string;
} | {
    type: 'progress_updated';
    progress: ResearchProgress;
} | {
    type: 'error';
    message: string;
};
//# sourceMappingURL=types.d.ts.map