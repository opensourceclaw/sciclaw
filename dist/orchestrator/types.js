/**
 * SciClaw v3.3.0 — Orchestrator Types
 *
 * Core type definitions for Research State Machine, Dynamic Planner,
 * Cross-Validation, Blind Spot Detection, and Iterative Refinement.
 */
// ── Research State Machine ────────────────────────────────────────────
/** States in the research lifecycle. */
export var ResearchState;
(function (ResearchState) {
    ResearchState["PLAN"] = "plan";
    ResearchState["SEARCH"] = "search";
    ResearchState["ANALYZE"] = "analyze";
    ResearchState["REFINE"] = "refine";
    ResearchState["DONE"] = "done";
    ResearchState["ABORTED"] = "aborted";
})(ResearchState || (ResearchState = {}));
/** Search strategies the Dynamic Planner can choose. */
export var ResearchStrategy;
(function (ResearchStrategy) {
    ResearchStrategy["BREADTH_FIRST"] = "breadth-first";
    ResearchStrategy["DEPTH_FIRST"] = "depth-first";
    ResearchStrategy["TREE_SEARCH"] = "tree-search";
    ResearchStrategy["PIVOT"] = "pivot";
})(ResearchStrategy || (ResearchStrategy = {}));
export const DEFAULT_RESEARCH_CONFIG = {
    maxIterations: 5,
    minConfidence: 0.6,
    strategies: [ResearchStrategy.BREADTH_FIRST],
    sources: ["duckduckgo"],
    enableMultiModal: false,
    maxResultAgeDays: 365,
};
export const DEFAULT_CONFIDENCE_CONFIG = {
    high: 0.9,
    medium: 0.6,
    sourceCredibility: {
        wikipedia: 0.85,
        arxiv: 0.9,
        github: 0.8,
        news: 0.7,
        blog: 0.5,
        social: 0.3,
        unknown: 0.4,
    },
    freshnessWeight: 0.15,
    agreementWeight: 0.5,
};
//# sourceMappingURL=types.js.map