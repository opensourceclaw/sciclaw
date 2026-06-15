/**
 * Chain of Thought - Facade for multi-step reasoning
 */
import { DecompositionStrategy, } from './types.js';
import { ProblemDecomposer } from './problem_decomposer.js';
import { StepExecutor } from './step_executor.js';
import { ResultAggregator } from './result_aggregator.js';
export { DecompositionStrategy, StepStatus, } from './types.js';
export { ProblemDecomposer } from './problem_decomposer.js';
export { StepExecutor } from './step_executor.js';
export { ResultAggregator } from './result_aggregator.js';
export class ChainOfThought {
    decomposer;
    executor;
    aggregator;
    constructor(llmEngine, config) {
        this.decomposer = new ProblemDecomposer(config);
        this.executor = new StepExecutor(llmEngine, config);
        this.aggregator = new ResultAggregator();
    }
    async decompose(question, strategy) {
        return this.decomposer.decompose(question, strategy);
    }
    async execute(steps) {
        const results = await this.executor.execute(steps);
        const strategy = steps[0]?.strategy ?? DecompositionStrategy.BALANCED;
        return this.aggregator.aggregate(results, steps[0]?.subQuestion ?? '', strategy);
    }
    async aggregate(steps) {
        // Reconstruct original question from first step
        const originalQuestion = steps[0]?.step.subQuestion ?? '';
        const chain = this.aggregator.aggregate(steps, originalQuestion);
        return chain.finalResult;
    }
}
//# sourceMappingURL=index.js.map