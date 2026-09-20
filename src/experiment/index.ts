/**
 * SciClaw v3.0.0 — Experiment Engine
 *
 * Unified engine coordinating experiment design, execution, and evaluation.
 */
import { ExperimentStatus } from "./types.js";
import type {
  Experiment,
  ExperimentResult,
  EvaluationReport,
  ExperimentConfig,
} from "./types.js";
import {
  ExperimentDesigner,
  createExperimentDesigner,
} from "./designer.js";
import {
  ExperimentRunner,
  createExperimentRunner,
} from "./runner.js";
import {
  ExperimentEvaluator,
  createExperimentEvaluator,
} from "./evaluator.js";

export * from "./types.js";
export * from "./designer.js";
export * from "./runner.js";
export * from "./evaluator.js";

// ── Config ─────────────────────────────────────────────────────────────

export interface ExperimentEngineConfig {
  designer?: Partial<ExperimentConfig>;
  runner?: Partial<ExperimentConfig>;
  evaluator?: Partial<ExperimentConfig>;
}

// ── ExperimentEngine ──────────────────────────────────────────────────

export class ExperimentEngine {
  private designer: ExperimentDesigner;
  private runner: ExperimentRunner;
  private evaluator: ExperimentEvaluator;

  constructor(config?: ExperimentEngineConfig) {
    this.designer = createExperimentDesigner(config?.designer);
    this.runner = createExperimentRunner(config?.runner);
    this.evaluator = createExperimentEvaluator(config?.evaluator);
  }

  design(hypothesis: {
    id: string;
    statement: string;
    category: string;
    confidence: number;
  }): Experiment {
    return this.designer.design(hypothesis);
  }

  async run(experiment: Experiment): Promise<ExperimentResult> {
    return this.runner.run(experiment);
  }

  evaluate(
    result: ExperimentResult,
    hypothesis?: { id: string; confidence: number },
  ): EvaluationReport {
    return this.evaluator.evaluate(result, hypothesis);
  }

  async runFullPipeline(hypothesis: {
    id: string;
    statement: string;
    category: string;
    confidence: number;
  }): Promise<{
    experiment: Experiment;
    result: ExperimentResult;
    report: EvaluationReport;
  }> {
    const experiment = this.designer.design(hypothesis);
    const validation = this.designer.validateExperiment(experiment);
    if (!validation.valid) {
      throw new Error(
        `Invalid experiment: ${validation.errors.join(", ")}`,
      );
    }
    experiment.status = ExperimentStatus.READY;
    const result = await this.runner.run(experiment);
    const report = this.evaluator.evaluate(result, hypothesis);
    return { experiment, result, report };
  }

  getStats(): { designed: number; run: number; evaluated: number } {
    const dStats = this.designer.getDesignStats();
    const rStats = this.runner.getRunnerStats();
    const eStats = this.evaluator.getEvaluationStats();
    return {
      designed: dStats.totalDesigned,
      run: rStats.totalRun,
      evaluated: eStats.totalEvaluated,
    };
  }

  getDesigner(): ExperimentDesigner {
    return this.designer;
  }

  getRunner(): ExperimentRunner {
    return this.runner;
  }

  getEvaluator(): ExperimentEvaluator {
    return this.evaluator;
  }
}

export function createExperimentEngine(
  config?: ExperimentEngineConfig,
): ExperimentEngine {
  return new ExperimentEngine(config);
}
