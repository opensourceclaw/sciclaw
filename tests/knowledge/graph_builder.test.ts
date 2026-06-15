import { describe, it, expect } from 'vitest';
import { buildGraph, mergeGraphs, addToGraph } from '../../src/knowledge/graph_builder.js';

describe('buildGraph', () => {
  it('should build graph from entities and relations', () => {
    const entities = [
      { text: 'Apple Inc', type: 'ORG', start: 0, end: 9, confidence: 0.9 },
      { text: 'Tim Cook', type: 'PERSON', start: 10, end: 18, confidence: 0.85 },
    ];
    const relations = [
      { source: 'Apple Inc', target: 'Tim Cook', type: 'CEO_OF', confidence: 0.8 },
    ];
    const graph = buildGraph(entities, relations);
    expect(graph.nodes.size).toBe(2);
    expect(graph.edges.size).toBe(1);
    expect(graph.adjacencyList.size).toBe(2);
  });

  it('should deduplicate nodes by ID and keep higher confidence', () => {
    const entities = [
      { text: 'Apple Inc', type: 'ORG', start: 0, end: 9, confidence: 0.9 },
      { text: 'Apple Inc', type: 'ORG', start: 0, end: 9, confidence: 0.95 },
    ];
    const graph = buildGraph(entities, []);
    expect(graph.nodes.size).toBe(1);
    expect(graph.nodes.values().next().value!.confidence).toBe(0.95);
  });

  it('should skip relations referencing unknown entities', () => {
    const entities = [
      { text: 'Apple Inc', type: 'ORG', start: 0, end: 9, confidence: 0.9 },
    ];
    const relations = [
      { source: 'Apple Inc', target: 'Unknown Entity', type: 'RELATED', confidence: 0.5 },
    ];
    const graph = buildGraph(entities, relations);
    expect(graph.nodes.size).toBe(1);
    expect(graph.edges.size).toBe(0);
  });

  it('should create bidirectional adjacency', () => {
    const entities = [
      { text: 'A', type: 'ORG', start: 0, end: 1, confidence: 0.9 },
      { text: 'B', type: 'ORG', start: 0, end: 1, confidence: 0.9 },
    ];
    const relations = [
      { source: 'A', target: 'B', type: 'RELATED', confidence: 0.8 },
    ];
    const graph = buildGraph(entities, relations);
    expect(graph.adjacencyList.get(graph.nodes.get(hash('A'))!.id)?.has(graph.nodes.get(hash('B'))!.id)).toBe(true);
    expect(graph.adjacencyList.get(graph.nodes.get(hash('B'))!.id)?.has(graph.nodes.get(hash('A'))!.id)).toBe(true);
  });
});

describe('mergeGraphs', () => {
  it('should merge multiple graphs', () => {
    const entities1 = [{ text: 'Node1', type: 'ORG', start: 0, end: 5, confidence: 0.9 }];
    const entities2 = [{ text: 'Node2', type: 'ORG', start: 0, end: 5, confidence: 0.8 }];
    const graph1 = buildGraph(entities1, []);
    const graph2 = buildGraph(entities2, []);
    const merged = mergeGraphs([graph1, graph2]);
    expect(merged.nodes.size).toBe(2);
  });
});

describe('addToGraph', () => {
  it('should add entities and relations to existing graph', () => {
    const initial = buildGraph(
      [{ text: 'Node1', type: 'ORG', start: 0, end: 5, confidence: 0.9 }],
      []
    );
    const result = addToGraph(
      initial,
      [{ text: 'Node2', type: 'ORG', start: 0, end: 5, confidence: 0.8 }],
      []
    );
    expect(result.nodes.size).toBe(2);
  });
});

// Helper for hashing in tests
import crypto from 'crypto';
function hash(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 8);
}
