/**
 * Chain of Thought - Facade for multi-step reasoning
 */
import type { LLMEngine } from '../../summarization/types.js';
import { DecomposedStep, ReasoningStepResult, ReasoningChain, DecompositionStrategy, ChainOfThoughtConfig } from './types.js';
export { DecompositionStrategy, StepStatus, ChainOfThoughtConfig, } from './types.js';
export type { DecomposedStep, ReasoningStepResult, ReasoningChain, } from './types.js';
export { ProblemDecomposer } from './problem_decomposer.js';
export { StepExecutor } from './step_executor.js';
export { ResultAggregator } from './result_aggregator.js';
export declare class ChainOfThought {
    private decomposer;
    private executor;
    private aggregator;
    constructor(llmEngine: LLMEngine, config?: Partial<ChainOfThoughtConfig>);
    decompose(question: string, strategy?: DecompositionStrategy): Promise<DecomposedStep[]>;
    execute(steps: DecomposedStep[]): Promise<ReasoningChain>;
    aggregate(steps: ReasoningStepResult[]): Promise<unknown>;
}
//# sourceMappingURL=index.d.ts.map