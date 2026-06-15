import type { GraphNode, GraphEdge, KnowledgeGraph } from "./types.js";

export class GraphStore {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();
  private adjacency: Map<string, Set<string>> = new Map();

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  getEdge(id: string): GraphEdge | undefined {
    return this.edges.get(id);
  }

  upsertNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
    if (!this.adjacency.has(node.id)) {
      this.adjacency.set(node.id, new Set());
    }
  }

  upsertEdge(edge: GraphEdge): void {
    this.edges.set(edge.id, edge);
    if (!this.adjacency.has(edge.sourceId)) this.adjacency.set(edge.sourceId, new Set());
    if (!this.adjacency.has(edge.targetId)) this.adjacency.set(edge.targetId, new Set());
    this.adjacency.get(edge.sourceId)!.add(edge.targetId);
    this.adjacency.get(edge.targetId)!.add(edge.sourceId);
  }

  removeNode(id: string): boolean {
    if (!this.nodes.has(id)) return false;
    this.nodes.delete(id);

    const connectedEdges: string[] = [];
    for (const [edgeId, edge] of this.edges) {
      if (edge.sourceId === id || edge.targetId === id) {
        connectedEdges.push(edgeId);
      }
    }
    for (const edgeId of connectedEdges) this.edges.delete(edgeId);

    this.adjacency.delete(id);
    for (const [, neighbors] of this.adjacency) {
      neighbors.delete(id);
    }

    return true;
  }

  removeEdge(id: string): boolean {
    const edge = this.edges.get(id);
    if (!edge) return false;
    this.edges.delete(id);
    this.adjacency.get(edge.sourceId)?.delete(edge.targetId);
    this.adjacency.get(edge.targetId)?.delete(edge.sourceId);
    return true;
  }

  importGraph(graph: KnowledgeGraph): void {
    this.nodes = new Map(graph.nodes);
    this.edges = new Map(graph.edges);
    this.adjacency = new Map();
    for (const [id, neighbors] of graph.adjacencyList) {
      this.adjacency.set(id, new Set(neighbors));
    }
  }

  exportGraph(): KnowledgeGraph {
    return {
      nodes: new Map(this.nodes),
      edges: new Map(this.edges),
      adjacencyList: new Map(
        [...this.adjacency.entries()].map(([id, neighbors]) => [id, new Set(neighbors)])
      ),
    };
  }

  getStats(): { nodeCount: number; edgeCount: number; density: number } {
    const nodeCount = this.nodes.size;
    const edgeCount = this.edges.size;
    const density = nodeCount > 1 ? (2 * edgeCount) / (nodeCount * (nodeCount - 1)) : 0;
    return { nodeCount, edgeCount, density: Math.round(density * 1000) / 1000 };
  }

  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.adjacency.clear();
  }
}
