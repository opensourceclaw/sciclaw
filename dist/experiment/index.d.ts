import type { Experiment, ExperimentResult, EvaluationReport, ExperimentConfig } from "./types.js";
import { ExperimentDesigner } from "./designer.js";
import { ExperimentRunner } from "./runner.js";
import { ExperimentEvaluator } from "./evaluator.js";
export * from "./types.js";
export * from "./designer.js";
export * from "./runner.js";
export * from "./evaluator.js";
export interface ExperimentEngineConfig {
    designer?: Partial<ExperimentConfig>;
    runner?: Partial<ExperimentConfig>;
    evaluator?: Partial<ExperimentConfig>;
}
export declare class ExperimentEngine {
    private designer;
    private runner;
    private evaluator;
    constructor(config?: ExperimentEngineConfig);
    design(hypothesis: {
        id: string;
        statement: string;
        category: string;
        confidence: number;
    }): Experiment;
    run(experiment: Experiment): Promise<ExperimentResult>;
    evaluate(result: ExperimentResult, hypothesis?: {
        id: string;
        confidence: number;
    }): EvaluationReport;
    runFullPipeline(hypothesis: {
        id: string;
        statement: string;
        category: string;
        confidence: number;
    }): Promise<{
        experiment: Experiment;
        result: ExperimentResult;
        report: EvaluationReport;
    }>;
    getStats(): {
        designed: number;
        run: number;
        evaluated: number;
    };
    getDesigner(): ExperimentDesigner;
    getRunner(): ExperimentRunner;
    getEvaluator(): ExperimentEvaluator;
}
export declare function createExperimentEngine(config?: ExperimentEngineConfig): ExperimentEngine;
//# sourceMappingURL=index.d.ts.map