/**
 * Step Executor - Executes reasoning steps according to dependency order
 *
 * Uses DAG-based scheduling: steps without dependencies run in parallel,
 * sequential chains run in order. Supports retry and timeout per step.
 */
import { DecomposedStep, ReasoningStepResult, ChainOfThoughtConfig } from './types.js';
import type { LLMEngine } from '../../summarization/types.js';
export declare class StepExecutor {
    private llmEngine;
    private config;
    private cache;
    constructor(llmEngine: LLMEngine, config?: Partial<ChainOfThoughtConfig>);
    execute(steps: DecomposedStep[]): Promise<ReasoningStepResult[]>;
    private executeStep;
    private makeFailedResult;
    private buildGraph;
    private detectCycle;
}
//# sourceMappingURL=step_executor.d.ts.map