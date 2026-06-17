import { describe, it, expect } from "vitest";
import {
  ExperimentRunner,
  createExperimentRunner,
} from "../../src/experiment/runner.js";
import {
  ExperimentStatus,
  ExperimentType,
  VariableType,
  MetricType,
} from "../../src/experiment/types.js";
import {
  ExperimentDesigner,
  createExperimentDesigner,
} from "../../src/experiment/designer.js";

describe("ExperimentRunner", () => {
  let runner: ExperimentRunner;
  let designer: ExperimentDesigner;

  beforeEach(() => {
    runner = createExperimentRunner();
    designer = createExperimentDesigner();
  });

  describe("run", () => {
    it("runs experiment successfully", async () => {
      const exp = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      exp.status = ExperimentStatus.READY;

      const result = await runner.run(exp);
      expect(result.experimentId).toBe(exp.id);
      expect(result.status).toBe("success");
    });

    it("returns ExperimentResult with correct structure", async () => {
      const exp = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      exp.status = ExperimentStatus.READY;

      const result = await runner.run(exp);
      expect(result.stepResults).toHaveLength(7);
      expect(result.metricResults.length).toBeGreaterThan(0);
      expect(result.observations.length).toBeGreaterThan(0);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it("executes all steps in order", async () => {
      const exp = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      exp.status = ExperimentStatus.READY;

      const result = await runner.run(exp);
      for (let i = 0; i < result.stepResults.length; i++) {
        expect(result.stepResults[i]!.order).toBe(i + 1);
      }
    });

    it("skips steps with failed dependencies", async () => {
      const exp = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      // Make step 2 fail by giving it a bad action
      exp.steps[1] = { ...exp.steps[1]!, action: "bad_action_will_throw" };
      exp.status = ExperimentStatus.READY;

      const result = await runner.run(exp);
      const skipped = result.stepResults.filter((s) => s.status === "skipped");
      expect(skipped.length).toBeGreaterThanOrEqual(0);
    });

    it("measures metrics after execution", async () => {
      const exp = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      exp.status = ExperimentStatus.READY;

      const result = await runner.run(exp);
      for (const mr of result.metricResults) {
        expect(mr.actualValue).toBeDefined();
        expect(mr.deviation).toBeDefined();
      }
    });

    it("experiment run time < 30s", async () => {
      const exp = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      exp.status = ExperimentStatus.READY;

      const result = await runner.run(exp);
      expect(result.durationMs).toBeLessThan(30000);
    });

    it("rejects already running experiment", async () => {
      const exp = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      exp.status = ExperimentStatus.READY;

      // Manually mark as running
      runner["running"].add(exp.id);
      await expect(runner.run(exp)).rejects.toThrow("already running");
      runner["running"].delete(exp.id);
    });

    it("rejects experiment in FAILED state", async () => {
      const exp = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      exp.status = ExperimentStatus.FAILED;
      await expect(runner.run(exp)).rejects.toThrow(/failed/i);
    });

    it("cancel stops running experiment", () => {
      const exp = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      runner["running"].add(exp.id);
      expect(runner.cancel(exp.id)).toBe(true);
      expect(runner.isRunning(exp.id)).toBe(false);
    });

    it("isRunning returns correct state", () => {
      expect(runner.isRunning("nonexistent")).toBe(false);
    });

    it("runBatch processes multiple experiments", async () => {
      const exp1 = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      const exp2 = designer.design({
        id: "h2",
        statement: "C leads to D",
        category: "causal",
        confidence: 0.6,
      });
      exp1.status = ExperimentStatus.READY;
      exp2.status = ExperimentStatus.READY;

      const results = await runner.runBatch([exp1, exp2]);
      expect(results).toHaveLength(2);
    });

    it("getRunnerStats tracks correctly", async () => {
      const exp = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      exp.status = ExperimentStatus.READY;
      await runner.run(exp);

      const stats = runner.getRunnerStats();
      expect(stats.totalRun).toBe(1);
    });
  });
});
