import { describe, it, expect } from 'vitest';
import { QueryExpander } from '../../../src/interactive/query_optimizer/expander.js';

describe('QueryExpander', () => {
  const expander = new QueryExpander();

  it('should expand query with synonyms', () => {
    const result = expander.expand('AI performance');
    expect(result.expansions.length).toBeGreaterThan(0);
  });

  it('should return empty for empty query', () => {
    const result = expander.expand('');
    expect(result.expansions).toHaveLength(0);
  });

  it('should respect maxExpansions limit', () => {
    const result = expander.expand('AI performance security database', 2);
    expect(result.expansions.length).toBeLessThanOrEqual(2);
  });

  it('should expand batch', () => {
    const results = expander.expandBatch(['AI', 'performance']);
    expect(results).toHaveLength(2);
  });

  it('should add custom synonyms', () => {
    expander.addSynonym('deepclaw', ['claw', 'deep-claw']);
    const result = expander.expand('deepclaw');
    expect(result.expansions.length).toBeGreaterThan(0);
  });

  it('should return scores with expansions', () => {
    const result = expander.expand('AI');
    expect(result.scores.length).toBe(result.expansions.length);
    result.scores.forEach((s) => {
      expect(s).toBeGreaterThan(0);
      expect(s).toBeLessThanOrEqual(1);
    });
  });

  it('should get default synonyms', () => {
    const synonyms = expander.getDefaultSynonyms();
    expect(synonyms.size).toBeGreaterThan(0);
  });
});
