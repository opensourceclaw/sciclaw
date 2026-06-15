export interface GraphNode {
    id: string;
    label: string;
    type: string;
    properties: Record<string, unknown>;
    confidence: number;
    sources: string[];
}
export interface GraphEdge {
    id: string;
    sourceId: string;
    targetId: string;
    type: string;
    label: string;
    confidence: number;
    properties: Record<string, unknown>;
    sources: string[];
}
export interface KnowledgeGraph {
    nodes: Map<string, GraphNode>;
    edges: Map<string, GraphEdge>;
    adjacencyList: Map<string, Set<string>>;
}
export interface GraphQuery {
    nodeTypes?: string[];
    edgeTypes?: string[];
    minConfidence?: number;
    maxDepth?: number;
}
export interface Subgraph {
    nodes: GraphNode[];
    edges: GraphEdge[];
}
//# sourceMappingURL=types.d.ts.map