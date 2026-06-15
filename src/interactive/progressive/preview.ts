/**
 * Preview Generator - Generates intermediate previews
 */

import type { SectionResult, ProgressPreview } from './types.js';

export class PreviewGenerator {
  generate(results: SectionResult[], totalSections: number): ProgressPreview {
    const completed = results.filter((r) => r.section.status === 'completed');
    const current = results.find((r) => r.section.status === 'building');

    return {
      totalSections,
      completedSections: completed.length,
      currentSection: current?.section.title,
      estimatedRemainingMs: this.estimateRemaining(completed.length, totalSections, completed),
      sections: results.map((r) => ({
        id: r.section.id,
        title: r.section.title,
        status: r.section.status,
        wordCount: r.wordCount,
      })),
    };
  }

  estimateRemaining(completed: number, total: number, completedResults: SectionResult[]): number {
    if (completed === 0 || total === 0) return 5000;
    if (completed >= total) return 0;

    const avgTime = completedResults.reduce((sum, r) => sum + r.durationMs, 0) / completed;
    const remaining = total - completed;

    return Math.max(5000, Math.round(avgTime * remaining));
  }

  generateSummary(results: SectionResult[]): string {
    const completed = results.filter((r) => r.section.status === 'completed');
    const failed = results.filter((r) => r.section.status === 'failed');

    if (completed.length === 0) return 'No sections completed yet.';

    const parts = completed.map(
      (r) => `- ${r.section.title}: ${r.wordCount} words (confidence: ${Math.round(r.confidence * 100)}%)`,
    );

    if (failed.length > 0) {
      parts.push(`\n${failed.length} section(s) failed.`);
    }

    return parts.join('\n');
  }
}
