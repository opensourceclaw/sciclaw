/**
 * DeepClaw v3.0.0 — Experiment Designer
 *
 * Automatic experiment design from hypothesis statements.
 * Generates variables, steps, metrics, and constraints.
 */
import { ExperimentType, VariableType } from "./types.js";
import type { Experiment, ExperimentVariable, ExperimentStep, ExperimentConfig } from "./types.js";
export declare class ExperimentDesigner {
    private config;
    private totalDesigned;
    constructor(config?: Partial<ExperimentConfig>);
    design(hypothesis: {
        id: string;
        statement: string;
        category: string;
        confidence: number;
    }): Experiment;
    designBatch(hypotheses: Array<{
        id: string;
        statement: string;
        category: string;
        confidence: number;
    }>): Experiment[];
    generateSteps(): ExperimentStep[];
    extractVariables(statement: string): ExperimentVariable[];
    classifyVariable(name: string, statement: string): VariableType;
    validateExperiment(experiment: Experiment): {
        valid: boolean;
        errors: string[];
    };
    getExperimentType(hypothesis: {
        category: string;
    }): ExperimentType;
    getDesignStats(): {
        totalDesigned: number;
    };
}
export declare function createExperimentDesigner(config?: Partial<ExperimentConfig>): ExperimentDesigner;
//# sourceMappingURL=designer.d.ts.map