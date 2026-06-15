import { describe, it, expect, beforeEach } from 'vitest';
import { GraphStore } from '../../src/knowledge/graph_store.js';
import type { GraphNode, GraphEdge } from '../../src/knowledge/types.js';

describe('GraphStore', () => {
  let store: GraphStore;
  const mockNode: GraphNode = { id: 'n1', label: 'Node1', type: 'ORG', properties: {}, confidence: 0.9, sources: [] };
  const mockNode2: GraphNode = { id: 'n2', label: 'Node2', type: 'PERSON', properties: {}, confidence: 0.8, sources: [] };
  const mockEdge: GraphEdge = { id: 'e1', sourceId: 'n1', targetId: 'n2', type: 'RELATED', label: 'RELATED', confidence: 0.7, properties: {}, sources: [] };

  beforeEach(() => {
    store = new GraphStore();
  });

  it('should upsert and get a node', () => {
    store.upsertNode(mockNode);
    expect(store.getNode('n1')).toEqual(mockNode);
  });

  it('should return undefined for nonexistent node', () => {
    expect(store.getNode('nonexistent')).toBeUndefined();
  });

  it('should upsert and get an edge', () => {
    store.upsertNode(mockNode);
    store.upsertNode(mockNode2);
    store.upsertEdge(mockEdge);
    expect(store.getEdge('e1')).toEqual(mockEdge);
  });

  it('should remove a node and its edges', () => {
    store.upsertNode(mockNode);
    store.upsertNode(mockNode2);
    store.upsertEdge(mockEdge);
    expect(store.removeNode('n1')).toBe(true);
    expect(store.getNode('n1')).toBeUndefined();
    expect(store.getEdge('e1')).toBeUndefined();
  });

  it('should return false when removing nonexistent node', () => {
    expect(store.removeNode('nonexistent')).toBe(false);
  });

  it('should remove an edge', () => {
    store.upsertNode(mockNode);
    store.upsertNode(mockNode2);
    store.upsertEdge(mockEdge);
    expect(store.removeEdge('e1')).toBe(true);
    expect(store.getEdge('e1')).toBeUndefined();
  });

  it('should import and export graph', () => {
    store.upsertNode(mockNode);
    store.upsertNode(mockNode2);
    store.upsertEdge(mockEdge);

    const exported = store.exportGraph();
    expect(exported.nodes.size).toBe(2);
    expect(exported.edges.size).toBe(1);

    const newStore = new GraphStore();
    newStore.importGraph(exported);
    expect(newStore.getNode('n1')).toBeDefined();
    expect(newStore.getEdge('e1')).toBeDefined();
  });

  it('should compute stats correctly', () => {
    expect(store.getStats().nodeCount).toBe(0);
    store.upsertNode(mockNode);
    store.upsertNode(mockNode2);
    store.upsertEdge(mockEdge);
    const stats = store.getStats();
    expect(stats.nodeCount).toBe(2);
    expect(stats.edgeCount).toBe(1);
    expect(stats.density).toBeGreaterThan(0);
  });

  it('should clear all data', () => {
    store.upsertNode(mockNode);
    store.upsertNode(mockNode2);
    store.clear();
    expect(store.getStats().nodeCount).toBe(0);
  });
});
