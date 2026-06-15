/**
 * Causal Analysis - Facade for causal relationship analysis
 */
import type { CausalVariable, CausalRelation, CausalGraph, ImpactAnalysis } from './types.js';
export { VariableExtractor } from './variable_extractor.js';
export { CausalExtractor } from './causal_extractor.js';
export { GraphBuilder } from './graph_builder.js';
export type { CausalVariable, CausalRelation, CausalGraph, ImpactAnalysis, ImpactPath, } from './types.js';
export declare class CausalAnalyzer {
    private variableExtractor;
    private causalExtractor;
    private graphBuilder;
    constructor();
    analyze(text: string): CausalGraph;
    extractVariables(text: string): CausalVariable[];
    extractRelations(text: string, variables: CausalVariable[]): CausalRelation[];
    buildGraph(variables: CausalVariable[], relations: CausalRelation[]): CausalGraph;
    detectCycles(relations: CausalRelation[]): string[][];
    analyzeImpact(relationId: string, variables: CausalVariable[], relations: CausalRelation[]): ImpactAnalysis;
    findComponents(variables: CausalVariable[], relations: CausalRelation[]): CausalGraph[];
}
//# sourceMappingURL=index.d.ts.map