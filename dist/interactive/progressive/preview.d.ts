/**
 * Preview Generator - Generates intermediate previews
 */
import type { SectionResult, ProgressPreview } from './types.js';
export declare class PreviewGenerator {
    generate(results: SectionResult[], totalSections: number): ProgressPreview;
    estimateRemaining(completed: number, total: number, completedResults: SectionResult[]): number;
    generateSummary(results: SectionResult[]): string;
}
//# sourceMappingURL=preview.d.ts.map