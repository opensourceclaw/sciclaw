import { describe, it, expect } from "vitest";
import {
  ExperimentEngine,
  createExperimentEngine,
} from "../../src/experiment/index.js";
import { ExperimentDesigner } from "../../src/experiment/designer.js";
import { ExperimentRunner } from "../../src/experiment/runner.js";
import { ExperimentEvaluator } from "../../src/experiment/evaluator.js";
import {
  ExperimentType,
  ExperimentStatus,
  VariableType,
  MetricType,
} from "../../src/experiment/types.js";

describe("ExperimentEngine", () => {
  let engine: ExperimentEngine;

  beforeEach(() => {
    engine = createExperimentEngine();
  });

  it("creates ExperimentEngine", () => {
    expect(engine).toBeInstanceOf(ExperimentEngine);
  });

  it("design delegates to designer", () => {
    const exp = engine.design({
      id: "h1",
      statement: "A causes B",
      category: "causal",
      confidence: 0.7,
    });
    expect(exp.type).toBe(ExperimentType.CONTROLLED);
  });

  it("run delegates to runner", async () => {
    const exp = engine.design({
      id: "h1",
      statement: "A causes B",
      category: "causal",
      confidence: 0.7,
    });
    exp.status = ExperimentStatus.READY;
    const result = await engine.run(exp);
    expect(result.status).toBe("success");
  });

  it("evaluate delegates to evaluator", async () => {
    const exp = engine.design({
      id: "h1",
      statement: "A causes B",
      category: "causal",
      confidence: 0.7,
    });
    exp.status = ExperimentStatus.READY;
    const result = await engine.run(exp);
    const report = engine.evaluate(result, { id: "h1", confidence: 0.7 });
    expect(report.overallScore).toBeGreaterThan(0);
  });

  it("runFullPipeline completes end-to-end", async () => {
    const output = await engine.runFullPipeline({
      id: "h-full",
      statement: "A causes B",
      category: "causal",
      confidence: 0.7,
    });
    expect(output.experiment).toBeDefined();
    expect(output.result.status).toBe("success");
    expect(output.report.hypothesisSupported).toBe(true);
  });

  it("getStats returns metrics", async () => {
    const exp = engine.design({
      id: "h1",
      statement: "A causes B",
      category: "causal",
      confidence: 0.7,
    });
    exp.status = ExperimentStatus.READY;
    await engine.run(exp);

    const stats = engine.getStats();
    expect(stats.designed).toBeGreaterThanOrEqual(1);
    expect(stats.run).toBeGreaterThanOrEqual(1);
  });

  it("getDesigner returns designer", () => {
    expect(engine.getDesigner()).toBeInstanceOf(ExperimentDesigner);
  });

  it("getRunner returns runner", () => {
    expect(engine.getRunner()).toBeInstanceOf(ExperimentRunner);
  });

  it("getEvaluator returns evaluator", () => {
    expect(engine.getEvaluator()).toBeInstanceOf(ExperimentEvaluator);
  });
});

describe("barrel exports", () => {
  it("exports ExperimentType enum", () => {
    expect(ExperimentType.CONTROLLED).toBe("controlled");
  });

  it("exports ExperimentStatus enum", () => {
    expect(ExperimentStatus.DRAFT).toBe("draft");
  });

  it("exports VariableType enum", () => {
    expect(VariableType.INDEPENDENT).toBe("independent");
  });

  it("exports MetricType enum", () => {
    expect(MetricType.ACCURACY).toBe("accuracy");
  });

  it("exports ExperimentDesigner class", () => {
    expect(ExperimentDesigner).toBeDefined();
  });

  it("exports ExperimentRunner class", () => {
    expect(ExperimentRunner).toBeDefined();
  });

  it("exports ExperimentEvaluator class", () => {
    expect(ExperimentEvaluator).toBeDefined();
  });

  it("exports ExperimentEngine class", () => {
    expect(ExperimentEngine).toBeDefined();
  });
});

describe("factory functions", () => {
  it("createExperimentEngine creates engine", () => {
    const e = createExperimentEngine();
    expect(e).toBeInstanceOf(ExperimentEngine);
  });

  it("createExperimentEngine accepts config", () => {
    const e = createExperimentEngine({
      designer: { maxSteps: 10 },
      runner: { defaultTimeoutMs: 5000 },
    });
    expect(e).toBeInstanceOf(ExperimentEngine);
  });
});
