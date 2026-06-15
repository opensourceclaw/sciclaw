import { describe, it, expect, beforeEach } from 'vitest';
import { GraphStore } from '../../src/knowledge/graph_store.js';
import { GraphQueryEngine } from '../../src/knowledge/graph_query.js';
import type { GraphNode, GraphEdge } from '../../src/knowledge/types.js';

describe('GraphQueryEngine', () => {
  let store: GraphStore;
  let engine: GraphQueryEngine;

  beforeEach(() => {
    store = new GraphStore();
    const nodes: GraphNode[] = [
      { id: 'a', label: 'Alice', type: 'PERSON', properties: {}, confidence: 0.9, sources: [] },
      { id: 'b', label: 'Bob', type: 'PERSON', properties: {}, confidence: 0.8, sources: [] },
      { id: 'c', label: 'Charlie', type: 'PERSON', properties: {}, confidence: 0.7, sources: [] },
      { id: 'd', label: 'Company', type: 'ORG', properties: {}, confidence: 0.85, sources: [] },
    ];
    const edges: GraphEdge[] = [
      { id: 'ab', sourceId: 'a', targetId: 'b', type: 'KNOWS', label: 'KNOWS', confidence: 0.9, properties: {}, sources: [] },
      { id: 'bc', sourceId: 'b', targetId: 'c', type: 'KNOWS', label: 'KNOWS', confidence: 0.8, properties: {}, sources: [] },
      { id: 'ad', sourceId: 'a', targetId: 'd', type: 'WORKS_AT', label: 'WORKS_AT', confidence: 0.95, properties: {}, sources: [] },
    ];
    for (const n of nodes) store.upsertNode(n);
    for (const e of edges) store.upsertEdge(e);
    engine = new GraphQueryEngine(store);
  });

  it('should get neighbors of a node', () => {
    const result = engine.getNeighbors('a');
    expect(result.nodes.length).toBe(2);
    expect(result.edges.length).toBe(2);
    const labels = result.nodes.map((n) => n.label).sort();
    expect(labels).toEqual(['Bob', 'Company']);
  });

  it('should return empty for nonexistent node', () => {
    const result = engine.getNeighbors('nonexistent');
    expect(result.nodes.length).toBe(0);
    expect(result.edges.length).toBe(0);
  });

  it('should filter neighbors by node type', () => {
    const result = engine.getNeighbors('a', { nodeTypes: ['ORG'] });
    expect(result.nodes.length).toBe(1);
    expect(result.nodes[0]!.label).toBe('Company');
  });

  it('should find shortest path between nodes', () => {
    const path = engine.findPath('a', 'c');
    expect(path).not.toBeNull();
    expect(path!.length).toBe(2);
    expect(path![0]!.id).toBe('ab');
    expect(path![1]!.id).toBe('bc');
  });

  it('should return empty path for same node', () => {
    const path = engine.findPath('a', 'a');
    expect(path).toEqual([]);
  });

  it('should return null for unreachable nodes', () => {
    const path = engine.findPath('a', 'nonexistent');
    expect(path).toBeNull();
  });

  it('should query subgraph with filters', () => {
    const result = engine.querySubgraph({ nodeTypes: ['PERSON'], minConfidence: 0.75 });
    expect(result.nodes.length).toBe(2);
    const labels = result.nodes.map((n) => n.label).sort();
    expect(labels).toEqual(['Alice', 'Bob']);
  });

  it('should search nodes by label pattern', () => {
    const nodes = engine.searchNodes('Ali');
    expect(nodes.length).toBe(1);
    expect(nodes[0]!.label).toBe('Alice');
  });

  it('should find connected components', () => {
    const components = engine.getConnectedComponents();
    expect(components.length).toBe(1);
    expect(components[0]!.length).toBe(4);
  });
});
