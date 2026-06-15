import { describe, it, expect } from 'vitest';
import { SectionSegmenter } from '../../../src/interactive/progressive/segmenter.js';
import type { ProcessedFeedback } from '../../../src/interactive/feedback/types.js';

function makeFeedback(action: ProcessedFeedback['action']): ProcessedFeedback {
  return {
    original: { id: '1', type: 'supplement', content: 'Add more details', source: 'user', timestamp: new Date() },
    action,
    priority: 0.6,
    adjustments: ['Expand: Add more details'],
    confidence: 0.7,
  };
}

describe('SectionSegmenter', () => {
  it('should segment a topic', () => {
    const segmenter = new SectionSegmenter();
    const sections = segmenter.segment('Research on AI');
    expect(sections.length).toBeGreaterThan(0);
    expect(sections[0]!.title).toBeDefined();
  });

  it('should use provided outline', () => {
    const segmenter = new SectionSegmenter();
    const sections = segmenter.segment('Test', ['intro', 'body', 'conclusion']);
    expect(sections).toHaveLength(3);
    expect(sections[0]!.title).toBe('intro');
  });

  it('should respect maxSections limit', () => {
    const segmenter = new SectionSegmenter({ maxSections: 2 });
    const sections = segmenter.segment('Research on AI and ML');
    expect(sections.length).toBeLessThanOrEqual(2);
  });

  it('should detect dependencies', () => {
    const segmenter = new SectionSegmenter();
    const sections = segmenter.segment('Test', ['a', 'b', 'c']);
    expect(sections[0]!.dependencies).toHaveLength(0);
    expect(sections[1]!.dependencies).toHaveLength(1);
  });

  it('should resegment on expand feedback', () => {
    const segmenter = new SectionSegmenter();
    const sections = segmenter.segment('Test', ['a']);
    const result = segmenter.resegment(sections, makeFeedback('expand'));
    expect(result.length).toBeGreaterThan(sections.length);
  });

  it('should not resegment on continue feedback', () => {
    const segmenter = new SectionSegmenter();
    const sections = segmenter.segment('Test', ['a']);
    const result = segmenter.resegment(sections, makeFeedback('continue'));
    expect(result).toHaveLength(sections.length);
  });
});
