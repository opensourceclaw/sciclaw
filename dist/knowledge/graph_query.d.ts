import type { GraphNode, GraphEdge, GraphQuery, Subgraph } from "./types.js";
import { GraphStore } from "./graph_store.js";
export declare class GraphQueryEngine {
    private store;
    constructor(store: GraphStore);
    getNeighbors(nodeId: string, query?: GraphQuery): Subgraph;
    findPath(fromId: string, toId: string, maxDepth?: number): GraphEdge[] | null;
    querySubgraph(query: GraphQuery): Subgraph;
    searchNodes(labelPattern: string): GraphNode[];
    getConnectedComponents(): GraphNode[][];
}
//# sourceMappingURL=graph_query.d.ts.map