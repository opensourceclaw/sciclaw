/**
 * SciClaw v3.0.0 — Experimental Design Types
 */
export declare enum ExperimentType {
    A_B_TEST = "ab_test",
    CONTROLLED = "controlled",
    OBSERVATIONAL = "observational",
    SIMULATION = "simulation",
    COMPARATIVE = "comparative"
}
export declare enum ExperimentStatus {
    DRAFT = "draft",
    READY = "ready",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export declare enum VariableType {
    INDEPENDENT = "independent",
    DEPENDENT = "dependent",
    CONTROL = "control",
    CONFOUNDING = "confounding"
}
export declare enum MetricType {
    ACCURACY = "accuracy",
    PRECISION = "precision",
    RECALL = "recall",
    F1_SCORE = "f1_score",
    LATENCY = "latency",
    THROUGHPUT = "throughput",
    CUSTOM = "custom"
}
export interface ExperimentVariable {
    id: string;
    name: string;
    type: VariableType;
    description: string;
    expectedRange?: {
        min: number;
        max: number;
    };
    unit?: string;
    currentValue?: number;
}
export interface ExperimentStep {
    id: string;
    order: number;
    action: string;
    description: string;
    expectedOutcome: string;
    durationEstimateMs: number;
    dependencies: string[];
}
export interface Experiment {
    id: string;
    name: string;
    hypothesisId: string;
    type: ExperimentType;
    status: ExperimentStatus;
    variables: ExperimentVariable[];
    steps: ExperimentStep[];
    metrics: ExperimentMetric[];
    constraints: ExperimentConstraint[];
    createdAt: Date;
    updatedAt: Date;
    startedAt?: Date;
    completedAt?: Date;
}
export interface ExperimentMetric {
    id: string;
    name: string;
    type: MetricType;
    targetValue: number;
    tolerance: number;
    unit?: string;
}
export interface ExperimentConstraint {
    id: string;
    description: string;
    type: "time" | "resource" | "ethical" | "technical";
    maxValue?: number;
    unit?: string;
}
export interface ExperimentResult {
    experimentId: string;
    status: "success" | "partial" | "failed";
    stepResults: StepResult[];
    metricResults: MetricResult[];
    observations: string[];
    durationMs: number;
    startedAt: Date;
    completedAt: Date;
}
export interface StepResult {
    stepId: string;
    order: number;
    status: "passed" | "failed" | "skipped";
    actualOutcome: string;
    durationMs: number;
    errors: string[];
}
export interface MetricResult {
    metricId: string;
    name: string;
    type: MetricType;
    targetValue: number;
    actualValue: number;
    deviation: number;
    passed: boolean;
}
export interface EvaluationReport {
    experimentId: string;
    overallScore: number;
    hypothesisSupported: boolean;
    confidence: number;
    metricSummary: {
        total: number;
        passed: number;
        failed: number;
        passRate: number;
    };
    stepSummary: {
        total: number;
        passed: number;
        failed: number;
        skipped: number;
        completionRate: number;
    };
    findings: Finding[];
    recommendations: string[];
    generatedAt: Date;
}
export interface Finding {
    id: string;
    description: string;
    significance: "high" | "medium" | "low";
    supportingMetrics: string[];
    relatedSteps: string[];
}
export interface ExperimentConfig {
    maxSteps: number;
    maxVariables: number;
    defaultTimeoutMs: number;
    minConfidenceForSupport: number;
    metricTolerance: number;
}
export declare const DEFAULT_EXPERIMENT_CONFIG: ExperimentConfig;
//# sourceMappingURL=types.d.ts.map