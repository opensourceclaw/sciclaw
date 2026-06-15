/**
 * ReasoningEngine - Main entry point for reasoning capabilities
 *
 * Integrates ChainOfThought, CausalAnalyzer, Explainer, and Visualizer
 * into a unified interface.
 */
import type { LLMEngine } from '../summarization/types.js';
import type { ReasoningOptions, ReasoningResult, ReasoningConfig } from './types.js';
import type { DecomposedStep, ReasoningChain } from './chain_of_thought/types.js';
import type { CausalGraph } from './causal_analysis/types.js';
import type { Explanation } from './explainer/types.js';
import type { VisualizationTree } from './visualization/types.js';
import { DecompositionStrategy } from './chain_of_thought/index.js';
export { ChainOfThought } from './chain_of_thought/index.js';
export { CausalAnalyzer } from './causal_analysis/index.js';
export { Explainer } from './explainer/index.js';
export { Visualizer } from './visualization/index.js';
export { DecompositionStrategy, StepStatus } from './chain_of_thought/types.js';
export type { ReasoningOptions, ReasoningResult, ReasoningConfig } from './types.js';
export type { DecomposedStep, ReasoningStepResult, ReasoningChain } from './chain_of_thought/types.js';
export type { CausalVariable, CausalRelation, CausalGraph } from './causal_analysis/types.js';
export type { Explanation, ConfidenceFactors, LogEntry } from './explainer/types.js';
export type { TreeNode, VisualizationTree, ExportOptions } from './visualization/types.js';
export declare class ReasoningEngine {
    private chainOfThought;
    private causalAnalyzer;
    private explainer;
    private visualizer;
    private config;
    constructor(llmEngine?: LLMEngine, config?: Partial<ReasoningConfig>);
    run(question: string, options?: ReasoningOptions): Promise<ReasoningResult>;
    decompose(question: string, strategy?: DecompositionStrategy): Promise<DecomposedStep[]>;
    analyzeCausal(text: string): Promise<CausalGraph>;
    explain(chain: ReasoningChain): Promise<Explanation>;
    visualize(chain: ReasoningChain, maxDepth?: number): Promise<VisualizationTree>;
}
//# sourceMappingURL=index.d.ts.map