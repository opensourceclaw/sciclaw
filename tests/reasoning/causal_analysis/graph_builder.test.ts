import { describe, it, expect } from 'vitest';
import { GraphBuilder } from '../../../src/reasoning/causal_analysis/graph_builder.js';
import type { CausalVariable, CausalRelation } from '../../../src/reasoning/causal_analysis/types.js';

function makeVar(id: string, name: string): CausalVariable {
  return { id, name, aliases: [], context: '', occurrences: 1 };
}

function makeRel(
  id: string,
  sourceId: string,
  targetId: string,
  strength = 0.7,
): CausalRelation {
  return {
    id,
    sourceId,
    targetId,
    relation: `${sourceId} -> ${targetId}`,
    strength,
    direction: 'unknown',
    confidence: 0.8,
    evidence: ['Test evidence.'],
  };
}

describe('GraphBuilder', () => {
  const builder = new GraphBuilder();

  it('should build a graph from variables and relations', () => {
    const variables = [makeVar('v1', 'A'), makeVar('v2', 'B')];
    const relations = [makeRel('r1', 'v1', 'v2')];
    const graph = builder.build(variables, relations);
    expect(graph.variables).toHaveLength(2);
    expect(graph.relations).toHaveLength(1);
    expect(graph.metadata.variableCount).toBe(2);
    expect(graph.metadata.relationCount).toBe(1);
  });

  it('should detect cycles in relations', () => {
    const relations = [
      makeRel('r1', 'v1', 'v2'),
      makeRel('r2', 'v2', 'v3'),
      makeRel('r3', 'v3', 'v1'),
    ];
    const cycles = builder.detectCycles(relations);
    expect(cycles.length).toBeGreaterThan(0);
  });

  it('should return empty cycles for DAG', () => {
    const relations = [
      makeRel('r1', 'v1', 'v2'),
      makeRel('r2', 'v2', 'v3'),
    ];
    const cycles = builder.detectCycles(relations);
    expect(cycles).toHaveLength(0);
  });

  it('should handle isolated nodes in graph', () => {
    const variables = [makeVar('v1', 'A'), makeVar('v2', 'B')];
    const graph = builder.build(variables, []);
    expect(graph.variables).toHaveLength(2);
    expect(graph.relations).toHaveLength(0);
  });

  it('should find connected components', () => {
    const variables = [
      makeVar('v1', 'A'),
      makeVar('v2', 'B'),
      makeVar('v3', 'C'),
      makeVar('v4', 'D'),
    ];
    const relations = [
      makeRel('r1', 'v1', 'v2'),
      makeRel('r2', 'v3', 'v4'),
    ];
    const components = builder.findConnectedComponents(variables, relations);
    expect(components.length).toBeGreaterThanOrEqual(2);
  });

  it('should analyze impact paths', () => {
    const variables = [makeVar('v1', 'A'), makeVar('v2', 'B'), makeVar('v3', 'C')];
    const relations = [
      makeRel('r1', 'v1', 'v2'),
      makeRel('r2', 'v2', 'v3'),
    ];
    const analysis = builder.analyzeImpact('r1', variables, relations);
    expect(analysis.rootCause).toBe('A');
    expect(analysis.impactPaths.length).toBeGreaterThan(0);
  });

  it('should return empty for unknown relation in impact analysis', () => {
    const analysis = builder.analyzeImpact('unknown', [], []);
    expect(analysis.summary).toBe('Relation not found');
  });
});
