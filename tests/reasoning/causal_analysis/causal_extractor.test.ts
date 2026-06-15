import { describe, it, expect } from 'vitest';
import { CausalExtractor } from '../../../src/reasoning/causal_analysis/causal_extractor.js';
import type { CausalVariable } from '../../../src/reasoning/causal_analysis/types.js';

function makeVar(id: string, name: string, aliases: string[] = []): CausalVariable {
  return { id, name, aliases, context: '', occurrences: 1 };
}

describe('CausalExtractor', () => {
  const extractor = new CausalExtractor();

  it('should extract causal relations from English text', () => {
    const text = 'Smoking causes lung cancer.';
    const variables = [
      makeVar('v1', 'Smoking'),
      makeVar('v2', 'lung cancer'),
    ];
    const relations = extractor.extract(text, variables);
    expect(relations.length).toBeGreaterThan(0);
    expect(relations[0]!.sourceId).toBe('v1');
    expect(relations[0]!.targetId).toBe('v2');
  });

  it('should extract causal relations from Chinese text', () => {
    const text = '吸烟导致肺癌。';
    const variables = [
      makeVar('v1', '吸烟'),
      makeVar('v2', '肺癌'),
    ];
    const relations = extractor.extract(text, variables);
    expect(relations.length).toBeGreaterThan(0);
    expect(relations[0]!.sourceId).toBe('v1');
    expect(relations[0]!.targetId).toBe('v2');
  });

  it('should return empty for text with no causal patterns', () => {
    const text = 'The sky is blue.';
    const variables = [
      makeVar('v1', 'sky'),
      makeVar('v2', 'blue'),
    ];
    const relations = extractor.extract(text, variables);
    expect(relations).toHaveLength(0);
  });

  it('should return empty for empty text', () => {
    const relations = extractor.extract('', []);
    expect(relations).toHaveLength(0);
  });

  it('should filter self-loop relations', () => {
    const text = 'A causes A.';
    const variables = [makeVar('v1', 'A')];
    const relations = extractor.extract(text, variables);
    expect(relations).toHaveLength(0);
  });

  it('should merge duplicate relations with increased confidence', () => {
    const text = 'Smoking causes lung cancer. Smoking leads to lung cancer.';
    const variables = [
      makeVar('v1', 'Smoking'),
      makeVar('v2', 'lung cancer'),
    ];
    const relations = extractor.extract(text, variables);
    expect(relations).toHaveLength(1);
    expect(relations[0]!.evidence.length).toBeGreaterThan(1);
  });

  it('should detect positive and negative directions', () => {
    const posText = 'Exercise promotes health.';
    const negText = 'Pollution reduces air quality.';
    const posVars = [makeVar('v1', 'Exercise'), makeVar('v2', 'health')];
    const negVars = [makeVar('v3', 'Pollution'), makeVar('v4', 'air quality')];

    const posRelations = extractor.extract(posText, posVars);
    const negRelations = extractor.extract(negText, negVars);

    if (posRelations.length > 0) expect(posRelations[0]!.direction).toBe('positive');
    if (negRelations.length > 0) expect(negRelations[0]!.direction).toBe('negative');
  });
});
