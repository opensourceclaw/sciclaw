import { describe, it, expect } from "vitest";
import {
  ExperimentEvaluator,
  createExperimentEvaluator,
} from "../../src/experiment/evaluator.js";
import {
  ExperimentDesigner,
  createExperimentDesigner,
} from "../../src/experiment/designer.js";
import {
  ExperimentRunner,
  createExperimentRunner,
} from "../../src/experiment/runner.js";
import { ExperimentStatus } from "../../src/experiment/types.js";
import type { ExperimentResult } from "../../src/experiment/types.js";

describe("ExperimentEvaluator", () => {
  let evaluator: ExperimentEvaluator;
  let designer: ExperimentDesigner;
  let runner: ExperimentRunner;

  beforeEach(() => {
    evaluator = createExperimentEvaluator();
    designer = createExperimentDesigner();
    runner = createExperimentRunner();
  });

  describe("evaluate", () => {
    it("evaluates experiment result", async () => {
      const exp = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      exp.status = ExperimentStatus.READY;
      const result = await runner.run(exp);
      const report = evaluator.evaluate(result, { id: "h1", confidence: 0.7 });

      expect(report.experimentId).toBe(exp.id);
      expect(report.overallScore).toBeGreaterThan(0);
      expect(report.hypothesisSupported).toBeDefined();
    });

    it("computes overall score", async () => {
      const exp = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      exp.status = ExperimentStatus.READY;
      const result = await runner.run(exp);
      const report = evaluator.evaluate(result);

      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(1);
    });

    it("determines hypothesis supported when score high", async () => {
      const exp = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      exp.status = ExperimentStatus.READY;
      const result = await runner.run(exp);
      // All steps pass → high score → supported
      const report = evaluator.evaluate(result, { id: "h1", confidence: 0.7 });
      expect(report.hypothesisSupported).toBe(true);
    });

    it("extracts findings from result", async () => {
      const exp = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      exp.status = ExperimentStatus.READY;
      const result = await runner.run(exp);
      const report = evaluator.evaluate(result);

      expect(report.findings.length).toBeGreaterThan(0);
    });

    it("generates recommendations", async () => {
      const exp = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      exp.status = ExperimentStatus.READY;
      const result = await runner.run(exp);
      const report = evaluator.evaluate(result);

      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it("handles all metrics failed (low score)", () => {
      const result: ExperimentResult = {
        experimentId: "exp-1",
        status: "failed",
        stepResults: [
          {
            stepId: "s1",
            order: 1,
            status: "failed",
            actualOutcome: "Failed",
            durationMs: 100,
            errors: ["Error"],
          },
        ],
        metricResults: [
          {
            metricId: "m1",
            name: "Accuracy",
            type: "accuracy" as any,
            targetValue: 0.8,
            actualValue: 0.1,
            deviation: 0.875,
            passed: false,
          },
        ],
        observations: [],
        durationMs: 100,
        startedAt: new Date(),
        completedAt: new Date(),
      };

      const report = evaluator.evaluate(result);
      expect(report.overallScore).toBeLessThan(0.5);
      expect(report.hypothesisSupported).toBe(false);
    });

    it("evaluateBatch processes multiple results", async () => {
      const exp1 = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      exp1.status = ExperimentStatus.READY;
      const r1 = await runner.run(exp1);

      const reports = evaluator.evaluateBatch([r1]);
      expect(reports).toHaveLength(1);
    });

    it("getEvaluationStats tracks correctly", async () => {
      const exp = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      exp.status = ExperimentStatus.READY;
      const result = await runner.run(exp);
      evaluator.evaluate(result);

      const stats = evaluator.getEvaluationStats();
      expect(stats.totalEvaluated).toBe(1);
    });

    it("isHypothesisSupported checks threshold", async () => {
      const exp = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      exp.status = ExperimentStatus.READY;
      const result = await runner.run(exp);

      expect(evaluator.isHypothesisSupported(result, 0.7)).toBe(true);
    });

    it("computeOverallScore returns number in [0,1]", async () => {
      const exp = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      exp.status = ExperimentStatus.READY;
      const result = await runner.run(exp);

      const score = evaluator.computeOverallScore(result);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });
});
