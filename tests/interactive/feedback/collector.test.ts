import { describe, it, expect } from 'vitest';
import { FeedbackCollector } from '../../../src/interactive/feedback/collector.js';

describe('FeedbackCollector', () => {
  it('should collect feedback', () => {
    const collector = new FeedbackCollector();
    const fb = collector.collect('positive', 'Great work', 'section-1');
    expect(fb.type).toBe('positive');
    expect(fb.content).toBe('Great work');
    expect(fb.target).toBe('section-1');
    expect(fb.timestamp).toBeInstanceOf(Date);
  });

  it('should throw on empty content', () => {
    const collector = new FeedbackCollector();
    expect(() => collector.collect('positive', '')).toThrow();
  });

  it('should throw on invalid type', () => {
    const collector = new FeedbackCollector();
    expect(() => collector.collect('invalid' as never, 'content')).toThrow();
  });

  it('should enforce maxHistory limit', () => {
    const collector = new FeedbackCollector({ maxHistory: 2 });
    collector.collect('positive', 'a');
    collector.collect('positive', 'b');
    collector.collect('positive', 'c');
    expect(collector.getHistory()).toHaveLength(2);
  });

  it('should filter by type', () => {
    const collector = new FeedbackCollector();
    collector.collect('positive', 'good');
    collector.collect('negative', 'bad');
    const positive = collector.getByType('positive');
    expect(positive).toHaveLength(1);
    expect(positive[0]!.type).toBe('positive');
  });

  it('should compute stats', () => {
    const collector = new FeedbackCollector();
    collector.collect('positive', 'good');
    collector.collect('negative', 'bad');
    collector.collect('positive', 'great');
    const stats = collector.stats();
    expect(stats.total).toBe(3);
    expect(stats.byType.positive).toBe(2);
    expect(stats.byType.negative).toBe(1);
  });

  it('should collect batch', () => {
    const collector = new FeedbackCollector();
    const results = collector.collectBatch([
      { type: 'positive', content: 'good' },
      { type: 'modify', content: 'change this' },
    ]);
    expect(results).toHaveLength(2);
  });

  it('should clear history', () => {
    const collector = new FeedbackCollector();
    collector.collect('positive', 'test');
    collector.clear();
    expect(collector.getHistory()).toHaveLength(0);
  });
});
