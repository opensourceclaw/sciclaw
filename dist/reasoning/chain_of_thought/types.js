/**
 * Chain of Thought types
 */
export var DecompositionStrategy;
(function (DecompositionStrategy) {
    DecompositionStrategy["BROAD"] = "broad";
    DecompositionStrategy["DEEP"] = "deep";
    DecompositionStrategy["BALANCED"] = "balanced";
})(DecompositionStrategy || (DecompositionStrategy = {}));
export var StepStatus;
(function (StepStatus) {
    StepStatus["PENDING"] = "pending";
    StepStatus["RUNNING"] = "running";
    StepStatus["COMPLETED"] = "completed";
    StepStatus["FAILED"] = "failed";
    StepStatus["SKIPPED"] = "skipped";
})(StepStatus || (StepStatus = {}));
//# sourceMappingURL=types.js.map