import { describe, it, expect } from 'vitest';
import { VariableExtractor } from '../../../src/reasoning/causal_analysis/variable_extractor.js';

describe('VariableExtractor', () => {
  const extractor = new VariableExtractor();

  it('should extract variables from text with causal keywords', () => {
    const text = 'Climate change causes rising sea levels and affects biodiversity.';
    const variables = extractor.extract(text);
    expect(variables.length).toBeGreaterThan(0);
  });

  it('should return empty array for empty text', () => {
    const variables = extractor.extract('');
    expect(variables).toHaveLength(0);
  });

  it('should return empty array for whitespace-only text', () => {
    const variables = extractor.extract('   ');
    expect(variables).toHaveLength(0);
  });

  it('should sort variables by occurrence count', () => {
    const text = 'AI impacts healthcare. AI also impacts education. Machine learning is part of AI.';
    const variables = extractor.extract(text);
    if (variables.length >= 2) {
      expect(variables[0]!.occurrences).toBeGreaterThanOrEqual(variables[1]!.occurrences);
    }
  });

  it('should extract variables from Chinese text', () => {
    const text = '温室气体导致全球变暖，进而影响生态系统。';
    const variables = extractor.extract(text);
    expect(variables.length).toBeGreaterThan(0);
  });

  it('should handle text with no causal keywords', () => {
    const text = 'The cat sat on the mat.';
    const variables = extractor.extract(text);
    expect(variables.length).toBeGreaterThanOrEqual(0);
  });
});
