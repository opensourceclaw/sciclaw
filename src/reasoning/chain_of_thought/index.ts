/**
 * Chain of Thought - Facade for multi-step reasoning
 */

import type { LLMEngine } from '../../summarization/types.js';
import {
  DecomposedStep,
  ReasoningStepResult,
  ReasoningChain,
  DecompositionStrategy,
  ChainOfThoughtConfig,
} from './types.js';
import { ProblemDecomposer } from './problem_decomposer.js';
import { StepExecutor } from './step_executor.js';
import { ResultAggregator } from './result_aggregator.js';

export {
  DecompositionStrategy,
  StepStatus,
  ChainOfThoughtConfig,
} from './types.js';
export type {
  DecomposedStep,
  ReasoningStepResult,
  ReasoningChain,
} from './types.js';
export { ProblemDecomposer } from './problem_decomposer.js';
export { StepExecutor } from './step_executor.js';
export { ResultAggregator } from './result_aggregator.js';

export class ChainOfThought {
  private decomposer: ProblemDecomposer;
  private executor: StepExecutor;
  private aggregator: ResultAggregator;

  constructor(llmEngine: LLMEngine, config?: Partial<ChainOfThoughtConfig>) {
    this.decomposer = new ProblemDecomposer(config);
    this.executor = new StepExecutor(llmEngine, config);
    this.aggregator = new ResultAggregator();
  }

  async decompose(
    question: string,
    strategy?: DecompositionStrategy,
  ): Promise<DecomposedStep[]> {
    return this.decomposer.decompose(question, strategy);
  }

  async execute(steps: DecomposedStep[]): Promise<ReasoningChain> {
    const results = await this.executor.execute(steps);
    const strategy = steps[0]?.strategy ?? DecompositionStrategy.BALANCED;
    return this.aggregator.aggregate(results, steps[0]?.subQuestion ?? '', strategy);
  }

  async aggregate(steps: ReasoningStepResult[]): Promise<unknown> {
    // Reconstruct original question from first step
    const originalQuestion = steps[0]?.step.subQuestion ?? '';
    const chain = this.aggregator.aggregate(steps, originalQuestion);
    return chain.finalResult;
  }
}
