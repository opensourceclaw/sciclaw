import type { Entity } from "../core/index.js";
import type { Relation } from "../core/index.js";
import type { KnowledgeGraph } from "./types.js";
export declare function buildGraph(entities: Entity[], relations: Relation[]): KnowledgeGraph;
export declare function mergeGraphs(graphs: KnowledgeGraph[]): KnowledgeGraph;
export declare function addToGraph(graph: KnowledgeGraph, entities: Entity[], relations: Relation[]): KnowledgeGraph;
//# sourceMappingURL=graph_builder.d.ts.map