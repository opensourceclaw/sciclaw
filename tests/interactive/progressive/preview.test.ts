import { describe, it, expect } from 'vitest';
import { PreviewGenerator } from '../../../src/interactive/progressive/preview.js';
import type { SectionResult, Section } from '../../../src/interactive/progressive/types.js';

function makeResult(id: string, title: string, status: Section['status'], wordCount: number): SectionResult {
  return {
    section: { id, title, description: '', dependencies: [], status, priority: 0.5 },
    content: 'x '.repeat(wordCount),
    wordCount,
    durationMs: 1000,
    confidence: status === 'completed' ? 0.8 : 0,
  };
}

describe('PreviewGenerator', () => {
  const generator = new PreviewGenerator();

  it('should generate preview', () => {
    const results = [
      makeResult('s1', 'Intro', 'completed', 100),
      makeResult('s2', 'Body', 'pending', 0),
    ];
    const preview = generator.generate(results, 2);
    expect(preview.totalSections).toBe(2);
    expect(preview.completedSections).toBe(1);
  });

  it('should estimate remaining time', () => {
    const results = [makeResult('s1', 'Intro', 'completed', 100)];
    const remaining = generator.estimateRemaining(1, 3, results);
    expect(remaining).toBeGreaterThan(0);
  });

  it('should return 5000ms when no sections completed', () => {
    const remaining = generator.estimateRemaining(0, 3, []);
    expect(remaining).toBe(5000);
  });

  it('should return 0ms when all completed', () => {
    const remaining = generator.estimateRemaining(3, 3, [
      makeResult('s1', 'a', 'completed', 100),
      makeResult('s2', 'b', 'completed', 100),
      makeResult('s3', 'c', 'completed', 100),
    ]);
    expect(remaining).toBe(0);
  });

  it('should generate summary', () => {
    const results = [
      makeResult('s1', 'Intro', 'completed', 100),
      makeResult('s2', 'Body', 'failed', 0),
    ];
    const summary = generator.generateSummary(results);
    expect(summary).toContain('Intro');
    expect(summary).toContain('failed');
  });

  it('should handle empty results', () => {
    const summary = generator.generateSummary([]);
    expect(summary).toBe('No sections completed yet.');
  });
});
