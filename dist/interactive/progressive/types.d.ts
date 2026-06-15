/**
 * Progressive Builder types
 */
export interface Section {
    id: string;
    title: string;
    description: string;
    dependencies: string[];
    status: 'pending' | 'building' | 'completed' | 'failed';
    priority: number;
}
export interface SectionResult {
    section: Section;
    content: string;
    wordCount: number;
    durationMs: number;
    confidence: number;
    error?: string;
}
export interface ProgressPreview {
    totalSections: number;
    completedSections: number;
    currentSection?: string;
    estimatedRemainingMs: number;
    sections: Array<{
        id: string;
        title: string;
        status: string;
        wordCount?: number;
    }>;
}
export interface SegmenterOptions {
    maxSections: number;
    minSectionWords: number;
    parallelBuild: boolean;
}
export interface BuilderOptions {
    maxRetries: number;
    timeoutMs: number;
}
//# sourceMappingURL=types.d.ts.map