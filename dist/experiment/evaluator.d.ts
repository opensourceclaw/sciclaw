import type { ExperimentResult, EvaluationReport, Finding, ExperimentConfig } from "./types.js";
export declare class ExperimentEvaluator {
    private config;
    private totalEvaluated;
    private supportedCount;
    private refutedCount;
    constructor(config?: Partial<ExperimentConfig>);
    evaluate(result: ExperimentResult, hypothesis?: {
        id: string;
        confidence: number;
    }): EvaluationReport;
    evaluateBatch(results: ExperimentResult[], hypotheses?: Array<{
        id: string;
        confidence: number;
    }>): EvaluationReport[];
    computeOverallScore(result: ExperimentResult): number;
    isHypothesisSupported(result: ExperimentResult, hypothesisConfidence: number): boolean;
    extractFindings(result: ExperimentResult): Finding[];
    generateRecommendations(report: EvaluationReport): string[];
    getEvaluationStats(): {
        totalEvaluated: number;
        supportedCount: number;
        refutedCount: number;
    };
}
export declare function createExperimentEvaluator(config?: Partial<ExperimentConfig>): ExperimentEvaluator;
//# sourceMappingURL=evaluator.d.ts.map