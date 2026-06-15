/**
 * Result Aggregator - Combines step results into a final ReasoningChain
 */
import { ReasoningStepResult, ReasoningChain, DecompositionStrategy } from './types.js';
export declare class ResultAggregator {
    aggregate(results: ReasoningStepResult[], originalQuestion: string, strategy?: DecompositionStrategy): ReasoningChain;
    detectConflicts(results: ReasoningStepResult[]): Array<{
        stepA: number;
        stepB: number;
        description: string;
    }>;
}
//# sourceMappingURL=result_aggregator.d.ts.map