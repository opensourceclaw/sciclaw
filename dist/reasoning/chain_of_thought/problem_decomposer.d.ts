/**
 * Problem Decomposer - Breaks complex questions into ordered sub-problems
 */
import { DecomposedStep, DecompositionStrategy, ChainOfThoughtConfig } from './types.js';
export declare class ProblemDecomposer {
    private config;
    constructor(config?: Partial<ChainOfThoughtConfig>);
    decompose(question: string, strategy?: DecompositionStrategy): DecomposedStep[];
    private decomposeCausal;
    private decomposeProcedural;
    private decomposeComparison;
    private decomposeMulti;
    private makeStep;
}
//# sourceMappingURL=problem_decomposer.d.ts.map