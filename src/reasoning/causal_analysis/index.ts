/**
 * Causal Analysis - Facade for causal relationship analysis
 */

import { VariableExtractor } from './variable_extractor.js';
import { CausalExtractor } from './causal_extractor.js';
import { GraphBuilder } from './graph_builder.js';
import type { CausalVariable, CausalRelation, CausalGraph, ImpactAnalysis } from './types.js';

export { VariableExtractor } from './variable_extractor.js';
export { CausalExtractor } from './causal_extractor.js';
export { GraphBuilder } from './graph_builder.js';
export type {
  CausalVariable,
  CausalRelation,
  CausalGraph,
  ImpactAnalysis,
  ImpactPath,
} from './types.js';

export class CausalAnalyzer {
  private variableExtractor: VariableExtractor;
  private causalExtractor: CausalExtractor;
  private graphBuilder: GraphBuilder;

  constructor() {
    this.variableExtractor = new VariableExtractor();
    this.causalExtractor = new CausalExtractor();
    this.graphBuilder = new GraphBuilder();
  }

  analyze(text: string): CausalGraph {
    const variables = this.variableExtractor.extract(text);
    const relations = this.causalExtractor.extract(text, variables);
    return this.graphBuilder.build(variables, relations);
  }

  extractVariables(text: string): CausalVariable[] {
    return this.variableExtractor.extract(text);
  }

  extractRelations(text: string, variables: CausalVariable[]): CausalRelation[] {
    return this.causalExtractor.extract(text, variables);
  }

  buildGraph(variables: CausalVariable[], relations: CausalRelation[]): CausalGraph {
    return this.graphBuilder.build(variables, relations);
  }

  detectCycles(relations: CausalRelation[]): string[][] {
    return this.graphBuilder.detectCycles(relations);
  }

  analyzeImpact(relationId: string, variables: CausalVariable[], relations: CausalRelation[]): ImpactAnalysis {
    return this.graphBuilder.analyzeImpact(relationId, variables, relations);
  }

  findComponents(variables: CausalVariable[], relations: CausalRelation[]): CausalGraph[] {
    return this.graphBuilder.findConnectedComponents(variables, relations);
  }
}
