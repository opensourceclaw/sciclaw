import type { CausalNode, CausalEdge, CausalGraph, CausalPath, ReasoningConfig } from "./types.js";
export declare class CausalAnalyzer {
    private config;
    constructor(config?: Partial<ReasoningConfig>);
    buildGraph(entities: Array<{
        name: string;
        relations: Array<{
            target: string;
            type: string;
        }>;
    }>): CausalGraph;
    addNode(graph: CausalGraph, node: CausalNode): CausalGraph;
    addEdge(graph: CausalGraph, edge: CausalEdge): CausalGraph;
    analyzeCausal(entities: Array<{
        name: string;
        relations: Array<{
            target: string;
            type: string;
        }>;
    }>): CausalGraph;
    findRootCauses(graph: CausalGraph): CausalNode[];
    findPaths(graph: CausalGraph, fromId: string, toId: string): CausalPath[];
    findStrongestPath(graph: CausalGraph, fromId: string, toId: string): CausalPath | null;
    getDownstreamEffects(graph: CausalGraph, nodeId: string): CausalNode[];
    getUpstreamCauses(graph: CausalGraph, nodeId: string): CausalNode[];
    getMediators(graph: CausalGraph): CausalNode[];
    exportGraph(graph: CausalGraph): {
        nodes: CausalNode[];
        edges: CausalEdge[];
    };
}
export declare function createCausalAnalyzer(config?: Partial<ReasoningConfig>): CausalAnalyzer;
//# sourceMappingURL=causal.d.ts.map