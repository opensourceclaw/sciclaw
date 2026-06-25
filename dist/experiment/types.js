/**
 * DeepClaw v3.0.0 — Experimental Design Types
 */
// ── Enums ────────────────────────────────────────────────────────────────
export var ExperimentType;
(function (ExperimentType) {
    ExperimentType["A_B_TEST"] = "ab_test";
    ExperimentType["CONTROLLED"] = "controlled";
    ExperimentType["OBSERVATIONAL"] = "observational";
    ExperimentType["SIMULATION"] = "simulation";
    ExperimentType["COMPARATIVE"] = "comparative";
})(ExperimentType || (ExperimentType = {}));
export var ExperimentStatus;
(function (ExperimentStatus) {
    ExperimentStatus["DRAFT"] = "draft";
    ExperimentStatus["READY"] = "ready";
    ExperimentStatus["RUNNING"] = "running";
    ExperimentStatus["COMPLETED"] = "completed";
    ExperimentStatus["FAILED"] = "failed";
    ExperimentStatus["CANCELLED"] = "cancelled";
})(ExperimentStatus || (ExperimentStatus = {}));
export var VariableType;
(function (VariableType) {
    VariableType["INDEPENDENT"] = "independent";
    VariableType["DEPENDENT"] = "dependent";
    VariableType["CONTROL"] = "control";
    VariableType["CONFOUNDING"] = "confounding";
})(VariableType || (VariableType = {}));
export var MetricType;
(function (MetricType) {
    MetricType["ACCURACY"] = "accuracy";
    MetricType["PRECISION"] = "precision";
    MetricType["RECALL"] = "recall";
    MetricType["F1_SCORE"] = "f1_score";
    MetricType["LATENCY"] = "latency";
    MetricType["THROUGHPUT"] = "throughput";
    MetricType["CUSTOM"] = "custom";
})(MetricType || (MetricType = {}));
export const DEFAULT_EXPERIMENT_CONFIG = {
    maxSteps: 20,
    maxVariables: 10,
    defaultTimeoutMs: 30000,
    minConfidenceForSupport: 0.6,
    metricTolerance: 0.05,
};
//# sourceMappingURL=types.js.map