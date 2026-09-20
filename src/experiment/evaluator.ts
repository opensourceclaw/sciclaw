/**
 * SciClaw v3.0.0 — Experiment Evaluator
 *
 * Evaluates experiment results, computes scores, extracts findings,
 * and generates recommendations.
 */
import { DEFAULT_EXPERIMENT_CONFIG } from "./types.js";
import type {
  ExperimentResult,
  EvaluationReport,
  Finding,
  ExperimentConfig,
} from "./types.js";

// ── Helpers ──────────────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID();
}

function computeOverallScore(result: ExperimentResult): number {
  const { metricResults, stepResults, observations } = result;

  const metricPassRate =
    metricResults.length > 0
      ? metricResults.filter((m) => m.passed).length /
        metricResults.length
      : 0;

  const stepCompletionRate =
    stepResults.length > 0
      ? stepResults.filter((s) => s.status === "passed").length /
        stepResults.length
      : 0;

  const avgDeviation =
    metricResults.length > 0
      ? metricResults.reduce((s, m) => s + m.deviation, 0) /
        metricResults.length
      : 1.0;
  const deviationScore = Math.max(0, 1.0 - avgDeviation);

  const observationScore = Math.min(observations.length / 5, 1.0);

  return (
    metricPassRate * 0.4 +
    stepCompletionRate * 0.3 +
    deviationScore * 0.2 +
    observationScore * 0.1
  );
}

function extractFindings(result: ExperimentResult): Finding[] {
  const findings: Finding[] = [];

  const allMetricsPassed = result.metricResults.every((m) => m.passed);
  if (allMetricsPassed && result.metricResults.length > 0) {
    findings.push({
      id: generateId(),
      description:
        "All experimental metrics met their target values",
      significance: "high",
      supportingMetrics: result.metricResults.map((m) => m.metricId),
      relatedSteps: [],
    });
  }

  for (const metric of result.metricResults) {
    if (metric.deviation < 0.05 && metric.passed) {
      findings.push({
        id: generateId(),
        description: `Metric "${metric.name}" significantly exceeded target (deviation: ${(metric.deviation * 100).toFixed(1)}%)`,
        significance: "medium",
        supportingMetrics: [metric.metricId],
        relatedSteps: [],
      });
    }
  }

  const failedSteps = result.stepResults.filter(
    (s) => s.status === "failed",
  );
  if (failedSteps.length > 0) {
    findings.push({
      id: generateId(),
      description: `${failedSteps.length} step(s) failed: ${failedSteps.map((s) => s.stepId).join(", ")}`,
      significance:
        failedSteps.length > 1 ? "high" : "medium",
      supportingMetrics: [],
      relatedSteps: failedSteps.map((s) => s.stepId),
    });
  }

  return findings;
}

function generateRecommendations(report: EvaluationReport): string[] {
  const recs: string[] = [];

  if (report.metricSummary.passRate < 0.5) {
    recs.push("Increase sample size to improve metric reliability");
  }
  if (report.stepSummary.failed > 0) {
    recs.push("Review failed steps for design flaws");
  }
  if (report.overallScore > 0.8) {
    recs.push(
      "Results are conclusive; consider publication or deployment",
    );
  }
  if (report.overallScore < 0.4) {
    recs.push(
      "Redesign experiment with tighter controls and more variables",
    );
  }
  if (report.stepSummary.skipped > 0) {
    recs.push(
      "Address dependency failures to prevent step skipping",
    );
  }

  return recs;
}

// ── ExperimentEvaluator ──────────────────────────────────────────────────

export class ExperimentEvaluator {
  private config: ExperimentConfig;
  private totalEvaluated = 0;
  private supportedCount = 0;
  private refutedCount = 0;

  constructor(config?: Partial<ExperimentConfig>) {
    this.config = { ...DEFAULT_EXPERIMENT_CONFIG, ...config };
  }

  evaluate(
    result: ExperimentResult,
    hypothesis?: { id: string; confidence: number },
  ): EvaluationReport {
    this.totalEvaluated++;

    const overallScore = computeOverallScore(result);

    const metricPassed = result.metricResults.filter(
      (m) => m.passed,
    ).length;
    const metricFailed = result.metricResults.length - metricPassed;
    const stepsPassed = result.stepResults.filter(
      (s) => s.status === "passed",
    ).length;
    const stepsFailed = result.stepResults.filter(
      (s) => s.status === "failed",
    ).length;
    const stepsSkipped = result.stepResults.filter(
      (s) => s.status === "skipped",
    ).length;

    const metricSummary = {
      total: result.metricResults.length,
      passed: metricPassed,
      failed: metricFailed,
      passRate:
        result.metricResults.length > 0
          ? Math.round(
              (metricPassed / result.metricResults.length) * 100,
            ) / 100
          : 0,
    };

    const stepSummary = {
      total: result.stepResults.length,
      passed: stepsPassed,
      failed: stepsFailed,
      skipped: stepsSkipped,
      completionRate:
        result.stepResults.length > 0
          ? Math.round(
              (stepsPassed / result.stepResults.length) * 100,
            ) / 100
          : 0,
    };

    const hypothesisSupported =
      overallScore >= this.config.minConfidenceForSupport;

    if (hypothesisSupported) this.supportedCount++;
    else this.refutedCount++;

    const findings = extractFindings(result);
    const report: EvaluationReport = {
      experimentId: result.experimentId,
      overallScore: Math.round(overallScore * 100) / 100,
      hypothesisSupported,
      confidence:
        hypothesis?.confidence ??
        (hypothesisSupported ? 0.8 : 0.3),
      metricSummary,
      stepSummary,
      findings,
      recommendations: [],
      generatedAt: new Date(),
    };

    report.recommendations = generateRecommendations(report);
    return report;
  }

  evaluateBatch(
    results: ExperimentResult[],
    hypotheses?: Array<{ id: string; confidence: number }>,
  ): EvaluationReport[] {
    return results.map((r, i) => this.evaluate(r, hypotheses?.[i]));
  }

  computeOverallScore(result: ExperimentResult): number {
    return computeOverallScore(result);
  }

  isHypothesisSupported(
    result: ExperimentResult,
    hypothesisConfidence: number,
  ): boolean {
    const score = computeOverallScore(result);
    return score >= this.config.minConfidenceForSupport;
  }

  extractFindings(result: ExperimentResult): Finding[] {
    return extractFindings(result);
  }

  generateRecommendations(report: EvaluationReport): string[] {
    return generateRecommendations(report);
  }

  getEvaluationStats(): {
    totalEvaluated: number;
    supportedCount: number;
    refutedCount: number;
  } {
    return {
      totalEvaluated: this.totalEvaluated,
      supportedCount: this.supportedCount,
      refutedCount: this.refutedCount,
    };
  }
}

export function createExperimentEvaluator(
  config?: Partial<ExperimentConfig>,
): ExperimentEvaluator {
  return new ExperimentEvaluator(config);
}
