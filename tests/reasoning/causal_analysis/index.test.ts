import { describe, it, expect } from 'vitest';
import { CausalAnalyzer } from '../../../src/reasoning/causal_analysis/index.js';

describe('CausalAnalyzer', () => {
  const analyzer = new CausalAnalyzer();

  it('should perform full analysis pipeline', () => {
    const text = 'Smoking causes lung cancer and leads to reduced life expectancy.';
    const graph = analyzer.analyze(text);
    expect(graph.variables.length).toBeGreaterThan(0);
    expect(graph.metadata.createdAt).toBeInstanceOf(Date);
  });

  it('should extract variables', () => {
    const text = 'Global warming leads to rising sea levels.';
    const variables = analyzer.extractVariables(text);
    expect(variables.length).toBeGreaterThan(0);
  });

  it('should detect cycles', () => {
    const variables = [
      { id: 'v1', name: 'A', aliases: [], context: '', occurrences: 1 },
      { id: 'v2', name: 'B', aliases: [], context: '', occurrences: 1 },
    ];
    const relations = [
      {
        id: 'r1', sourceId: 'v1', targetId: 'v2', relation: 'A->B',
        strength: 0.7, direction: 'unknown' as const, confidence: 0.8, evidence: [''],
      },
      {
        id: 'r2', sourceId: 'v2', targetId: 'v1', relation: 'B->A',
        strength: 0.7, direction: 'unknown' as const, confidence: 0.8, evidence: [''],
      },
    ];
    const cycles = analyzer.detectCycles(relations);
    expect(cycles.length).toBeGreaterThan(0);
  });

  it('should handle empty text', () => {
    const graph = analyzer.analyze('');
    expect(graph.variables).toHaveLength(0);
    expect(graph.relations).toHaveLength(0);
  });
});
