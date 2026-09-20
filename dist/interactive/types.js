/**
 * SciClaw v3.0.0 — Interactive Research Types
 */
// ── Enums ────────────────────────────────────────────────────────────────
export var InteractionMode;
(function (InteractionMode) {
    InteractionMode["GUIDED"] = "guided";
    InteractionMode["EXPLORATORY"] = "exploratory";
    InteractionMode["COLLABORATIVE"] = "collaborative";
})(InteractionMode || (InteractionMode = {}));
export var QueryType;
(function (QueryType) {
    QueryType["CLARIFICATION"] = "clarification";
    QueryType["DIRECTION"] = "direction";
    QueryType["DEPTH"] = "depth";
    QueryType["VALIDATION"] = "validation";
    QueryType["PREFERENCE"] = "preference";
})(QueryType || (QueryType = {}));
export var FeedbackAction;
(function (FeedbackAction) {
    FeedbackAction["ACCEPT"] = "accept";
    FeedbackAction["REJECT"] = "reject";
    FeedbackAction["MODIFY"] = "modify";
    FeedbackAction["REFINE"] = "refine";
    FeedbackAction["SKIP"] = "skip";
    FeedbackAction["REDIRECT"] = "redirect";
})(FeedbackAction || (FeedbackAction = {}));
export var SessionStatus;
(function (SessionStatus) {
    SessionStatus["ACTIVE"] = "active";
    SessionStatus["PAUSED"] = "paused";
    SessionStatus["WAITING_USER"] = "waiting_user";
    SessionStatus["COMPLETED"] = "completed";
    SessionStatus["EXPIRED"] = "expired";
})(SessionStatus || (SessionStatus = {}));
export const DEFAULT_INTERACTIVE_CONFIG = {
    mode: InteractionMode.COLLABORATIVE,
    sessionTimeoutMs: 1800000,
    maxTurns: 50,
    adaptiveQueryMaxPerTurn: 3,
    feedbackProcessingDelayMs: 100,
    queryGenerationTimeoutMs: 500,
};
//# sourceMappingURL=types.js.map