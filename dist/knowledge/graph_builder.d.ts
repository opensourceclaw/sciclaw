import type { Entity } from "@deepclaw/core";
import type { Relation } from "@deepclaw/core";
import type { KnowledgeGraph } from "./types.js";
export declare function buildGraph(entities: Entity[], relations: Relation[]): KnowledgeGraph;
export declare function mergeGraphs(graphs: KnowledgeGraph[]): KnowledgeGraph;
export declare function addToGraph(graph: KnowledgeGraph, entities: Entity[], relations: Relation[]): KnowledgeGraph;
//# sourceMappingURL=graph_builder.d.ts.map