import type { Experiment, ExperimentResult, ExperimentConfig } from "./types.js";
export declare class ExperimentRunner {
    private config;
    private running;
    private totalRun;
    private totalDuration;
    constructor(config?: Partial<ExperimentConfig>);
    run(experiment: Experiment): Promise<ExperimentResult>;
    runBatch(experiments: Experiment[]): Promise<ExperimentResult[]>;
    cancel(experimentId: string): boolean;
    isRunning(experimentId: string): boolean;
    getRunnerStats(): {
        totalRun: number;
        activeCount: number;
        avgDurationMs: number;
    };
}
export declare function createExperimentRunner(config?: Partial<ExperimentConfig>): ExperimentRunner;
//# sourceMappingURL=runner.d.ts.map