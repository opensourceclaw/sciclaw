/**
 * SciClaw v3.0.0 — Experiment Engine
 *
 * Unified engine coordinating experiment design, execution, and evaluation.
 */
import { ExperimentStatus } from "./types.js";
import { createExperimentDesigner, } from "./designer.js";
import { createExperimentRunner, } from "./runner.js";
import { createExperimentEvaluator, } from "./evaluator.js";
export * from "./types.js";
export * from "./designer.js";
export * from "./runner.js";
export * from "./evaluator.js";
// ── ExperimentEngine ──────────────────────────────────────────────────
export class ExperimentEngine {
    designer;
    runner;
    evaluator;
    constructor(config) {
        this.designer = createExperimentDesigner(config?.designer);
        this.runner = createExperimentRunner(config?.runner);
        this.evaluator = createExperimentEvaluator(config?.evaluator);
    }
    design(hypothesis) {
        return this.designer.design(hypothesis);
    }
    async run(experiment) {
        return this.runner.run(experiment);
    }
    evaluate(result, hypothesis) {
        return this.evaluator.evaluate(result, hypothesis);
    }
    async runFullPipeline(hypothesis) {
        const experiment = this.designer.design(hypothesis);
        const validation = this.designer.validateExperiment(experiment);
        if (!validation.valid) {
            throw new Error(`Invalid experiment: ${validation.errors.join(", ")}`);
        }
        experiment.status = ExperimentStatus.READY;
        const result = await this.runner.run(experiment);
        const report = this.evaluator.evaluate(result, hypothesis);
        return { experiment, result, report };
    }
    getStats() {
        const dStats = this.designer.getDesignStats();
        const rStats = this.runner.getRunnerStats();
        const eStats = this.evaluator.getEvaluationStats();
        return {
            designed: dStats.totalDesigned,
            run: rStats.totalRun,
            evaluated: eStats.totalEvaluated,
        };
    }
    getDesigner() {
        return this.designer;
    }
    getRunner() {
        return this.runner;
    }
    getEvaluator() {
        return this.evaluator;
    }
}
export function createExperimentEngine(config) {
    return new ExperimentEngine(config);
}
//# sourceMappingURL=index.js.map