import { describe, it, expect } from "vitest";
import {
  ExperimentDesigner,
  createExperimentDesigner,
} from "../../src/experiment/designer.js";
import {
  ExperimentType,
  ExperimentStatus,
  VariableType,
} from "../../src/experiment/types.js";

describe("ExperimentDesigner", () => {
  let designer: ExperimentDesigner;

  beforeEach(() => {
    designer = createExperimentDesigner();
  });

  describe("design", () => {
    it("designs experiment from causal hypothesis", () => {
      const exp = designer.design({
        id: "h1",
        statement: "Smoking causes lung cancer",
        category: "causal",
        confidence: 0.7,
      });
      expect(exp.type).toBe(ExperimentType.CONTROLLED);
      expect(exp.variables.length).toBeGreaterThanOrEqual(2);
      expect(exp.status).toBe(ExperimentStatus.DRAFT);
    });

    it("designs experiment from correlational hypothesis", () => {
      const exp = designer.design({
        id: "h2",
        statement: "Ice cream sales is associated with drowning rates",
        category: "correlational",
        confidence: 0.5,
      });
      expect(exp.type).toBe(ExperimentType.OBSERVATIONAL);
    });

    it("designs experiment from predictive hypothesis", () => {
      const exp = designer.design({
        id: "h3",
        statement: "Model predicts temperature rise",
        category: "predictive",
        confidence: 0.6,
      });
      expect(exp.type).toBe(ExperimentType.SIMULATION);
    });

    it("designs experiment from comparative hypothesis", () => {
      const exp = designer.design({
        id: "h4",
        statement: "Electric is more efficient than gas",
        category: "comparative",
        confidence: 0.8,
      });
      expect(exp.type).toBe(ExperimentType.A_B_TEST);
    });

    it("generates 7 steps", () => {
      const exp = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      expect(exp.steps).toHaveLength(7);
    });

    it("steps have correct dependencies", () => {
      const exp = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      // First step has no deps
      expect(exp.steps[0]!.dependencies).toEqual([]);
      // Each subsequent step depends on the previous
      for (let i = 1; i < exp.steps.length; i++) {
        expect(exp.steps[i]!.dependencies).toContain(exp.steps[i - 1]!.id);
      }
    });

    it("extracts independent and dependent variables", () => {
      const exp = designer.design({
        id: "h1",
        statement: "Pollution affects biodiversity",
        category: "causal",
        confidence: 0.7,
      });
      const independent = exp.variables.filter(
        (v) => v.type === VariableType.INDEPENDENT,
      );
      const dependent = exp.variables.filter(
        (v) => v.type === VariableType.DEPENDENT,
      );
      expect(independent.length).toBeGreaterThanOrEqual(1);
      expect(dependent.length).toBeGreaterThanOrEqual(1);
    });

    it("defines metrics for experiment", () => {
      const exp = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      expect(exp.metrics.length).toBeGreaterThanOrEqual(1);
    });

    it("designBatch processes multiple hypotheses", () => {
      const experiments = designer.designBatch([
        { id: "h1", statement: "A causes B", category: "causal", confidence: 0.7 },
        { id: "h2", statement: "C correlates D", category: "correlational", confidence: 0.5 },
      ]);
      expect(experiments).toHaveLength(2);
    });
  });

  describe("validateExperiment", () => {
    it("validates correct experiment structure", () => {
      const exp = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      const result = designer.validateExperiment(exp);
      expect(result.valid).toBe(true);
    });

    it("rejects experiment with < 3 steps", () => {
      const exp = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      exp.steps = exp.steps.slice(0, 2);
      const result = designer.validateExperiment(exp);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("at least 3"))).toBe(true);
    });

    it("rejects experiment with < 2 variables", () => {
      const exp = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      exp.variables = [];
      const result = designer.validateExperiment(exp);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("variables"))).toBe(true);
    });

    it("rejects experiment without independent variable", () => {
      const exp = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      exp.variables = exp.variables.map((v) => ({
        ...v,
        type: VariableType.DEPENDENT,
      }));
      const result = designer.validateExperiment(exp);
      expect(result.valid).toBe(false);
    });

    it("rejects experiment with circular step deps", () => {
      const exp = designer.design({
        id: "h1",
        statement: "A causes B",
        category: "causal",
        confidence: 0.7,
      });
      // Create cycle
      exp.steps[0]!.dependencies = [exp.steps[6]!.id];
      const result = designer.validateExperiment(exp);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("circular"))).toBe(true);
    });
  });

  describe("extractVariables", () => {
    it("extracts from causal statement", () => {
      const vars = designer.extractVariables("Smoking causes Cancer");
      expect(vars).toHaveLength(2);
      expect(vars[0]!.name).toBe("Smoking");
      expect(vars[1]!.name).toBe("Cancer");
    });

    it("extracts from correlated statement", () => {
      const vars = designer.extractVariables("Ice cream is correlated with temperature");
      expect(vars).toHaveLength(2);
    });

    it("falls back to generic variables for unparseable statement", () => {
      const vars = designer.extractVariables("something vague");
      expect(vars.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("getDesignStats", () => {
    it("tracks design count", () => {
      designer.design({ id: "h1", statement: "A causes B", category: "causal", confidence: 0.7 });
      designer.design({ id: "h2", statement: "C leads to D", category: "causal", confidence: 0.6 });
      expect(designer.getDesignStats().totalDesigned).toBe(2);
    });
  });
});
