import type { GraphNode, GraphEdge, GraphQuery, Subgraph } from "./types.js";
import { GraphStore } from "./graph_store.js";

export class GraphQueryEngine {
  private store: GraphStore;

  constructor(store: GraphStore) {
    this.store = store;
  }

  getNeighbors(nodeId: string, query?: GraphQuery): Subgraph {
    const result: Subgraph = { nodes: [], edges: [] };
    const root = this.store.getNode(nodeId);
    if (!root) return result;

    const graph = this.store.exportGraph();
    const neighbors = graph.adjacencyList.get(nodeId);
    if (!neighbors) return result;

    for (const neighborId of neighbors) {
      const neighbor = graph.nodes.get(neighborId);
      if (!neighbor) continue;

      if (query?.nodeTypes && !query.nodeTypes.includes(neighbor.type)) continue;
      if (query?.minConfidence !== undefined && neighbor.confidence < query.minConfidence) continue;

      result.nodes.push(neighbor);

      for (const edge of graph.edges.values()) {
        if ((edge.sourceId === nodeId && edge.targetId === neighborId) ||
            (edge.sourceId === neighborId && edge.targetId === nodeId)) {
          if (query?.edgeTypes && !query.edgeTypes.includes(edge.type)) continue;
          if (query?.minConfidence !== undefined && edge.confidence < query.minConfidence) continue;
          if (!result.edges.find((e) => e.id === edge.id)) {
            result.edges.push(edge);
          }
        }
      }
    }

    return result;
  }

  findPath(fromId: string, toId: string, maxDepth = 5): GraphEdge[] | null {
    if (fromId === toId) return [];
    const graph = this.store.exportGraph();
    if (!graph.nodes.has(fromId) || !graph.nodes.has(toId)) return null;

    const visited = new Set<string>();
    const queue: Array<{ nodeId: string; path: GraphEdge[] }> = [{ nodeId: fromId, path: [] }];
    visited.add(fromId);

    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!;
      if (path.length >= maxDepth) continue;

      const neighbors = graph.adjacencyList.get(nodeId);
      if (!neighbors) continue;

      for (const neighborId of neighbors) {
        if (visited.has(neighborId)) continue;
        visited.add(neighborId);

        const connectingEdge = [...graph.edges.values()].find(
          (e) => (e.sourceId === nodeId && e.targetId === neighborId) ||
                  (e.sourceId === neighborId && e.targetId === nodeId)
        );
        if (!connectingEdge) continue;

        const newPath = [...path, connectingEdge];
        if (neighborId === toId) return newPath;

        queue.push({ nodeId: neighborId, path: newPath });
      }
    }

    return null;
  }

  querySubgraph(query: GraphQuery): Subgraph {
    const graph = this.store.exportGraph();
    const result: Subgraph = { nodes: [], edges: [] };

    for (const node of graph.nodes.values()) {
      if (query.nodeTypes && !query.nodeTypes.includes(node.type)) continue;
      if (query.minConfidence !== undefined && node.confidence < query.minConfidence) continue;
      result.nodes.push(node);
    }

    const nodeIds = new Set(result.nodes.map((n) => n.id));
    for (const edge of graph.edges.values()) {
      if (!nodeIds.has(edge.sourceId) || !nodeIds.has(edge.targetId)) continue;
      if (query.edgeTypes && !query.edgeTypes.includes(edge.type)) continue;
      if (query.minConfidence !== undefined && edge.confidence < query.minConfidence) continue;
      result.edges.push(edge);
    }

    return result;
  }

  searchNodes(labelPattern: string): GraphNode[] {
    if (!labelPattern) return [...this.store.exportGraph().nodes.values()];
    const lower = labelPattern.toLowerCase();
    const graph = this.store.exportGraph();
    return [...graph.nodes.values()].filter((n) => n.label.toLowerCase().includes(lower));
  }

  getConnectedComponents(): GraphNode[][] {
    const graph = this.store.exportGraph();
    const visited = new Set<string>();
    const components: GraphNode[][] = [];

    for (const [nodeId] of graph.nodes) {
      if (visited.has(nodeId)) continue;

      const component: GraphNode[] = [];
      const queue = [nodeId];
      visited.add(nodeId);

      while (queue.length > 0) {
        const current = queue.shift()!;
        const node = graph.nodes.get(current);
        if (node) component.push(node);

        const neighbors = graph.adjacencyList.get(current);
        if (neighbors) {
          for (const n of neighbors) {
            if (!visited.has(n)) {
              visited.add(n);
              queue.push(n);
            }
          }
        }
      }

      components.push(component);
    }

    return components;
  }
}
