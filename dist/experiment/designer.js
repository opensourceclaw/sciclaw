/**
 * SciClaw v3.0.0 — Experiment Designer
 *
 * Automatic experiment design from hypothesis statements.
 * Generates variables, steps, metrics, and constraints.
 */
import { ExperimentType, ExperimentStatus, VariableType, MetricType, DEFAULT_EXPERIMENT_CONFIG, } from "./types.js";
// ── Helpers ──────────────────────────────────────────────────────────────
function generateId() {
    return crypto.randomUUID();
}
function hasCycleInSteps(steps) {
    const stepMap = new Map(steps.map((s) => [s.id, s]));
    const visited = new Set();
    const inStack = new Set();
    function dfs(stepId) {
        if (inStack.has(stepId))
            return true;
        if (visited.has(stepId))
            return false;
        visited.add(stepId);
        inStack.add(stepId);
        const step = stepMap.get(stepId);
        if (step) {
            for (const depId of step.dependencies) {
                if (dfs(depId))
                    return true;
            }
        }
        inStack.delete(stepId);
        return false;
    }
    for (const step of steps) {
        if (dfs(step.id))
            return true;
    }
    return false;
}
function getExperimentType(category) {
    switch (category) {
        case "causal":
            return ExperimentType.CONTROLLED;
        case "correlational":
            return ExperimentType.OBSERVATIONAL;
        case "predictive":
            return ExperimentType.SIMULATION;
        case "comparative":
            return ExperimentType.A_B_TEST;
        default:
            return ExperimentType.CONTROLLED;
    }
}
function extractVariables(statement) {
    const variables = [];
    const causalMatch = statement.match(/^(.+?)\s+(causes?|affects?|influences?|leads?\s+to|impacts?)\s+(.+)$/i);
    if (causalMatch) {
        variables.push({
            id: generateId(),
            name: causalMatch[1].trim(),
            type: VariableType.INDEPENDENT,
            description: `Independent variable: ${causalMatch[1].trim()}`,
        });
        variables.push({
            id: generateId(),
            name: causalMatch[3].trim(),
            type: VariableType.DEPENDENT,
            description: `Dependent variable: ${causalMatch[3].trim()}`,
        });
        return variables;
    }
    const corrMatch = statement.match(/^(.+?)\s+(is\s+)?(associated|correlated|linked|related)\s+(with|to)\s+(.+)$/i);
    if (corrMatch) {
        variables.push({
            id: generateId(),
            name: corrMatch[1].trim(),
            type: VariableType.INDEPENDENT,
            description: `Variable A: ${corrMatch[1].trim()}`,
        });
        variables.push({
            id: generateId(),
            name: corrMatch[5].trim(),
            type: VariableType.DEPENDENT,
            description: `Variable B: ${corrMatch[5].trim()}`,
        });
        return variables;
    }
    // Fallback: extract noun phrases
    const nounPhrases = statement.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g);
    if (nounPhrases && nounPhrases.length >= 2) {
        variables.push({
            id: generateId(),
            name: nounPhrases[0],
            type: VariableType.INDEPENDENT,
            description: `Extracted variable: ${nounPhrases[0]}`,
        });
        variables.push({
            id: generateId(),
            name: nounPhrases[1],
            type: VariableType.DEPENDENT,
            description: `Extracted variable: ${nounPhrases[1]}`,
        });
    }
    else {
        variables.push({
            id: generateId(),
            name: "Factor_A",
            type: VariableType.INDEPENDENT,
            description: "Generic independent variable",
        }, {
            id: generateId(),
            name: "Factor_B",
            type: VariableType.DEPENDENT,
            description: "Generic dependent variable",
        });
    }
    return variables;
}
function generateSteps() {
    const steps = [];
    const s1Id = generateId();
    const s2Id = generateId();
    const s3Id = generateId();
    const s4Id = generateId();
    const s5Id = generateId();
    const s6Id = generateId();
    const s7Id = generateId();
    steps.push({
        id: s1Id,
        order: 1,
        action: "setup",
        description: "Define experimental variables and prepare test environment",
        expectedOutcome: "Variables identified and environment ready",
        durationEstimateMs: 1000,
        dependencies: [],
    });
    steps.push({
        id: s2Id,
        order: 2,
        action: "measure_baseline",
        description: "Measure baseline state",
        expectedOutcome: "Baseline metrics recorded",
        durationEstimateMs: 2000,
        dependencies: [s1Id],
    });
    steps.push({
        id: s3Id,
        order: 3,
        action: "manipulation_round_1",
        description: "Apply independent variable change (round 1/3)",
        expectedOutcome: "Variable manipulated, system responded",
        durationEstimateMs: 3000,
        dependencies: [s2Id],
    });
    steps.push({
        id: s4Id,
        order: 4,
        action: "manipulation_round_2",
        description: "Apply independent variable change (round 2/3)",
        expectedOutcome: "Variable manipulated, system responded",
        durationEstimateMs: 3000,
        dependencies: [s3Id],
    });
    steps.push({
        id: s5Id,
        order: 5,
        action: "manipulation_round_3",
        description: "Apply independent variable change (round 3/3)",
        expectedOutcome: "Variable manipulated, system responded",
        durationEstimateMs: 3000,
        dependencies: [s4Id],
    });
    steps.push({
        id: s6Id,
        order: 6,
        action: "analyze",
        description: "Analyze results across all manipulation rounds",
        expectedOutcome: "Statistical significance determined",
        durationEstimateMs: 2000,
        dependencies: [s5Id],
    });
    steps.push({
        id: s7Id,
        order: 7,
        action: "validate",
        description: "Validate results against constraints and reproducibility",
        expectedOutcome: "Results validated and reproducible",
        durationEstimateMs: 2000,
        dependencies: [s6Id],
    });
    return steps;
}
function generateMetrics(type) {
    switch (type) {
        case ExperimentType.CONTROLLED:
            return [
                {
                    id: generateId(),
                    name: "Effect Size",
                    type: MetricType.ACCURACY,
                    targetValue: 0.8,
                    tolerance: 0.05,
                },
                {
                    id: generateId(),
                    name: "Statistical Significance",
                    type: MetricType.PRECISION,
                    targetValue: 0.95,
                    tolerance: 0.05,
                },
            ];
        case ExperimentType.SIMULATION:
            return [
                {
                    id: generateId(),
                    name: "Prediction Accuracy",
                    type: MetricType.ACCURACY,
                    targetValue: 0.85,
                    tolerance: 0.05,
                },
                {
                    id: generateId(),
                    name: "F1 Score",
                    type: MetricType.F1_SCORE,
                    targetValue: 0.8,
                    tolerance: 0.1,
                },
            ];
        default:
            return [
                {
                    id: generateId(),
                    name: "Result Accuracy",
                    type: MetricType.ACCURACY,
                    targetValue: 0.8,
                    tolerance: 0.05,
                },
            ];
    }
}
// ── ExperimentDesigner ───────────────────────────────────────────────────
export class ExperimentDesigner {
    config;
    totalDesigned = 0;
    constructor(config) {
        this.config = { ...DEFAULT_EXPERIMENT_CONFIG, ...config };
        if (this.config.maxSteps < 3)
            this.config.maxSteps = 3;
        if (this.config.maxSteps > 100)
            this.config.maxSteps = 100;
        if (this.config.maxVariables < 2)
            this.config.maxVariables = 2;
        if (this.config.maxVariables > 50)
            this.config.maxVariables = 50;
    }
    design(hypothesis) {
        const type = getExperimentType(hypothesis.category);
        const variables = extractVariables(hypothesis.statement).slice(0, this.config.maxVariables);
        const steps = generateSteps();
        const metrics = generateMetrics(type);
        const constraints = [
            {
                id: generateId(),
                description: "Experiment must complete within timeout",
                type: "time",
                maxValue: this.config.defaultTimeoutMs,
                unit: "ms",
            },
            {
                id: generateId(),
                description: `Maximum ${this.config.maxVariables} variables`,
                type: "resource",
                maxValue: this.config.maxVariables,
            },
        ];
        this.totalDesigned++;
        return {
            id: generateId(),
            name: `Experiment: ${hypothesis.statement.slice(0, 60)}`,
            hypothesisId: hypothesis.id,
            type,
            status: ExperimentStatus.DRAFT,
            variables,
            steps,
            metrics,
            constraints,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
    designBatch(hypotheses) {
        return hypotheses.map((h) => this.design(h));
    }
    generateSteps() {
        return generateSteps();
    }
    extractVariables(statement) {
        return extractVariables(statement);
    }
    classifyVariable(name, statement) {
        if (statement.startsWith(name))
            return VariableType.INDEPENDENT;
        return VariableType.DEPENDENT;
    }
    validateExperiment(experiment) {
        const errors = [];
        if (experiment.steps.length < 3) {
            errors.push("Experiment must have at least 3 steps");
        }
        if (experiment.steps.length > this.config.maxSteps) {
            errors.push(`Experiment exceeds max steps (${this.config.maxSteps})`);
        }
        if (experiment.variables.length < 2) {
            errors.push("Experiment must have at least 2 variables");
        }
        if (!experiment.variables.some((v) => v.type === VariableType.INDEPENDENT)) {
            errors.push("Must have at least one independent variable");
        }
        if (!experiment.variables.some((v) => v.type === VariableType.DEPENDENT)) {
            errors.push("Must have at least one dependent variable");
        }
        if (hasCycleInSteps(experiment.steps)) {
            errors.push("Steps contain circular dependencies");
        }
        if (experiment.metrics.length === 0) {
            errors.push("Must have at least one metric");
        }
        return { valid: errors.length === 0, errors };
    }
    getExperimentType(hypothesis) {
        return getExperimentType(hypothesis.category);
    }
    getDesignStats() {
        return { totalDesigned: this.totalDesigned };
    }
}
export function createExperimentDesigner(config) {
    return new ExperimentDesigner(config);
}
//# sourceMappingURL=designer.js.map