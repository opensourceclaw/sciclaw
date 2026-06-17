/**
 * DeepClaw v3.0.0 — Experimental Design Types
 */

// ── Enums ────────────────────────────────────────────────────────────────

export enum ExperimentType {
  A_B_TEST = "ab_test",
  CONTROLLED = "controlled",
  OBSERVATIONAL = "observational",
  SIMULATION = "simulation",
  COMPARATIVE = "comparative",
}

export enum ExperimentStatus {
  DRAFT = "draft",
  READY = "ready",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum VariableType {
  INDEPENDENT = "independent",
  DEPENDENT = "dependent",
  CONTROL = "control",
  CONFOUNDING = "confounding",
}

export enum MetricType {
  ACCURACY = "accuracy",
  PRECISION = "precision",
  RECALL = "recall",
  F1_SCORE = "f1_score",
  LATENCY = "latency",
  THROUGHPUT = "throughput",
  CUSTOM = "custom",
}

// ── Experiment ───────────────────────────────────────────────────────────

export interface ExperimentVariable {
  id: string;
  name: string;
  type: VariableType;
  description: string;
  expectedRange?: { min: number; max: number };
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

// ── Results ──────────────────────────────────────────────────────────────

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

// ── Evaluation ───────────────────────────────────────────────────────────

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

// ── Config ────────────────────────────────────────────────────────────────

export interface ExperimentConfig {
  maxSteps: number;
  maxVariables: number;
  defaultTimeoutMs: number;
  minConfidenceForSupport: number;
  metricTolerance: number;
}

export const DEFAULT_EXPERIMENT_CONFIG: ExperimentConfig = {
  maxSteps: 20,
  maxVariables: 10,
  defaultTimeoutMs: 30000,
  minConfidenceForSupport: 0.6,
  metricTolerance: 0.05,
};
