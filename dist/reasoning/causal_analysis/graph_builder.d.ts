/**
 * Graph Builder - Builds causal relationship graphs and performs impact analysis
 */
import type { CausalVariable, CausalRelation, CausalGraph, ImpactAnalysis } from './types.js';
export declare class GraphBuilder {
    build(variables: CausalVariable[], relations: CausalRelation[]): CausalGraph;
    detectCycles(relations: CausalRelation[]): string[][];
    analyzeImpact(relationId: string, variables: CausalVariable[], relations: CausalRelation[]): ImpactAnalysis;
    findConnectedComponents(variables: CausalVariable[], relations: CausalRelation[]): CausalGraph[];
}
//# sourceMappingURL=graph_builder.d.ts.map