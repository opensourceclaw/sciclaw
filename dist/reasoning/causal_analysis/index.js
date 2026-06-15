/**
 * Causal Analysis - Facade for causal relationship analysis
 */
import { VariableExtractor } from './variable_extractor.js';
import { CausalExtractor } from './causal_extractor.js';
import { GraphBuilder } from './graph_builder.js';
export { VariableExtractor } from './variable_extractor.js';
export { CausalExtractor } from './causal_extractor.js';
export { GraphBuilder } from './graph_builder.js';
export class CausalAnalyzer {
    variableExtractor;
    causalExtractor;
    graphBuilder;
    constructor() {
        this.variableExtractor = new VariableExtractor();
        this.causalExtractor = new CausalExtractor();
        this.graphBuilder = new GraphBuilder();
    }
    analyze(text) {
        const variables = this.variableExtractor.extract(text);
        const relations = this.causalExtractor.extract(text, variables);
        return this.graphBuilder.build(variables, relations);
    }
    extractVariables(text) {
        return this.variableExtractor.extract(text);
    }
    extractRelations(text, variables) {
        return this.causalExtractor.extract(text, variables);
    }
    buildGraph(variables, relations) {
        return this.graphBuilder.build(variables, relations);
    }
    detectCycles(relations) {
        return this.graphBuilder.detectCycles(relations);
    }
    analyzeImpact(relationId, variables, relations) {
        return this.graphBuilder.analyzeImpact(relationId, variables, relations);
    }
    findComponents(variables, relations) {
        return this.graphBuilder.findConnectedComponents(variables, relations);
    }
}
//# sourceMappingURL=index.js.map