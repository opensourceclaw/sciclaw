/**
 * DeepClaw v3.0.0 — Advanced Reasoning Types
 *
 * Type definitions for reasoning chain and causal analysis.
 */
// ── Enums ────────────────────────────────────────────────────────────────
export var ReasoningStepType;
(function (ReasoningStepType) {
    ReasoningStepType["OBSERVATION"] = "observation";
    ReasoningStepType["HYPOTHESIS"] = "hypothesis";
    ReasoningStepType["INFERENCE"] = "inference";
    ReasoningStepType["VALIDATION"] = "validation";
    ReasoningStepType["CONCLUSION"] = "conclusion";
})(ReasoningStepType || (ReasoningStepType = {}));
export var CausalRelationType;
(function (CausalRelationType) {
    CausalRelationType["CAUSES"] = "causes";
    CausalRelationType["PREVENTS"] = "prevents";
    CausalRelationType["ENABLES"] = "enables";
    CausalRelationType["INHIBITS"] = "inhibits";
    CausalRelationType["CORRELATES_WITH"] = "correlates_with";
})(CausalRelationType || (CausalRelationType = {}));
export var InferenceDirection;
(function (InferenceDirection) {
    InferenceDirection["FORWARD"] = "forward";
    InferenceDirection["BACKWARD"] = "backward";
})(InferenceDirection || (InferenceDirection = {}));
export const DEFAULT_REASONING_CONFIG = {
    maxSteps: 7,
    minConfidence: 0.3,
    maxAlternatives: 3,
    direction: InferenceDirection.FORWARD,
};
//# sourceMappingURL=types.js.map