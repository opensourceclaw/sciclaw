import type { GraphNode, GraphEdge, KnowledgeGraph } from "./types.js";
export declare class GraphStore {
    private nodes;
    private edges;
    private adjacency;
    getNode(id: string): GraphNode | undefined;
    getEdge(id: string): GraphEdge | undefined;
    upsertNode(node: GraphNode): void;
    upsertEdge(edge: GraphEdge): void;
    removeNode(id: string): boolean;
    removeEdge(id: string): boolean;
    importGraph(graph: KnowledgeGraph): void;
    exportGraph(): KnowledgeGraph;
    getStats(): {
        nodeCount: number;
        edgeCount: number;
        density: number;
    };
    clear(): void;
}
//# sourceMappingURL=graph_store.d.ts.map