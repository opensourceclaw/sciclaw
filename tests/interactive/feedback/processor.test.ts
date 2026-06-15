import { describe, it, expect } from 'vitest';
import { FeedbackProcessor } from '../../../src/interactive/feedback/processor.js';
import type { UserFeedback } from '../../../src/interactive/feedback/types.js';

function makeFeedback(type: UserFeedback['type'], content: string): UserFeedback {
  return {
    id: 'fb-1', type, content, source: 'user', timestamp: new Date(),
  };
}

describe('FeedbackProcessor', () => {
  const processor = new FeedbackProcessor();

  it('should process positive feedback', () => {
    const result = processor.process(makeFeedback('positive', 'Keep going'));
    expect(result.action).toBe('continue');
    expect(result.priority).toBe(0.3);
  });

  it('should process negative feedback', () => {
    const result = processor.process(makeFeedback('negative', 'Wrong direction'));
    expect(result.action).toBe('redirect');
    expect(result.priority).toBe(0.8);
  });

  it('should process pause feedback', () => {
    const result = processor.process(makeFeedback('pause', 'Stop now'));
    expect(result.action).toBe('halt');
    expect(result.priority).toBe(1.0);
  });

  it('should handle empty content', () => {
    const result = processor.process(makeFeedback('positive', ''));
    expect(result.action).toBe('continue');
    expect(result.priority).toBe(0);
  });

  it('should merge multiple results', () => {
    const results = [
      processor.process(makeFeedback('positive', 'good')),
      processor.process(makeFeedback('negative', 'bad')),
    ];
    const merged = processor.merge(results);
    expect(merged.action).toBe('redirect'); // negative > positive
    expect(merged.priority).toBe(0.8);
  });

  it('should merge empty list', () => {
    const merged = processor.merge([]);
    expect(merged.action).toBe('continue');
    expect(merged.priority).toBe(0);
  });

  it('should process batch', () => {
    const feedbacks = [
      makeFeedback('positive', 'good'),
      makeFeedback('modify', 'change'),
    ];
    const results = processor.processBatch(feedbacks);
    expect(results).toHaveLength(2);
  });

  it('should generate adjustments', () => {
    const result = processor.process(makeFeedback('modify', 'Update the analysis'));
    expect(result.adjustments.length).toBeGreaterThan(0);
    expect(result.adjustments[0]).toContain('Refine');
  });
});
