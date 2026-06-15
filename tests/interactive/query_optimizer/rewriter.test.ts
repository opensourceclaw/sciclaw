import { describe, it, expect } from 'vitest';
import { QueryRewriter } from '../../../src/interactive/query_optimizer/rewriter.js';
import type { ProcessedFeedback } from '../../../src/interactive/feedback/types.js';

function makeFeedback(action: ProcessedFeedback['action']): ProcessedFeedback {
  return {
    original: { id: '1', type: 'negative', content: 'too broad', source: 'user', timestamp: new Date() },
    action,
    priority: 0.8,
    adjustments: ['Redirect: too broad'],
    confidence: 0.7,
  };
}

describe('QueryRewriter', () => {
  const rewriter = new QueryRewriter();

  it('should rewrite based on feedback', () => {
    const results = rewriter.rewrite('AI is too broad', makeFeedback('redirect'));
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it('should return original query for continue action', () => {
    const results = rewriter.rewrite('AI', makeFeedback('continue'));
    expect(results).toEqual(['AI']);
  });

  it('should handle empty query', () => {
    const results = rewriter.rewrite('', makeFeedback('redirect'));
    expect(results).toEqual([]);
  });

  it('should rewrite batch', () => {
    const results = rewriter.rewriteBatch(
      ['AI research'],
      [makeFeedback('refine')],
    );
    expect(results.length).toBeGreaterThan(0);
  });

  it('should add custom rules', () => {
    rewriter.addRule({ pattern: /test/i, replacement: 'production', description: 'Test rule' });
    const results = rewriter.rewrite('test system', makeFeedback('refine'));
    expect(results.some((r) => r.includes('production'))).toBe(true);
  });

  it('should get default rules', () => {
    const rules = rewriter.getDefaultRules();
    expect(rules.length).toBeGreaterThan(0);
  });
});
