/**
 * DeepClaw v3.3.0 — Orchestrator Types
 *
 * Core type definitions for Research State Machine, Dynamic Planner,
 * Cross-Validation, Blind Spot Detection, and Iterative Refinement.
 */
/** States in the research lifecycle. */
export declare enum ResearchState {
    PLAN = "plan",
    SEARCH = "search",
    ANALYZE = "analyze",
    REFINE = "refine",
    DONE = "done",
    ABORTED = "aborted"
}
/** Search strategies the Dynamic Planner can choose. */
export declare enum ResearchStrategy {
    BREADTH_FIRST = "breadth-first",
    DEPTH_FIRST = "depth-first",
    TREE_SEARCH = "tree-search",
    PIVOT = "pivot"
}
export interface SubQuery {
    id: string;
    query: string;
    aspect: string;
    sources: string[];
    priority: number;
}
export interface RawClaim {
    id: string;
    text: string;
    source: string;
    sourceUrl?: string;
    extractedAt: Date;
}
export interface ValidatedClaim {
    id: string;
    claim: string;
    sources: string[];
    contradictingSources: string[];
    confidence: number;
    status: "verified" | "disputed" | "unverified";
}
export interface Contradiction {
    claimA: ValidatedClaim;
    claimB: ValidatedClaim;
    overlapScore: number;
    resolution: "prefer_a" | "prefer_b" | "neither" | "both_possible";
}
export type BlindSpotReason = "uncovered" | "contradiction" | "shallow" | "stale";
export interface BlindSpot {
    id: string;
    aspect: string;
    reason: BlindSpotReason;
    priority: number;
    suggestedQueries: string[];
}
export interface CompletenessReport {
    aspectsCovered: string[];
    aspectsMissing: string[];
    coverageRatio: number;
    depthPerAspect: Record<string, "deep" | "moderate" | "shallow">;
}
export interface PivotSignal {
    type: "low_relevance" | "contradiction" | "information_gain_drop" | "new_aspect";
    confidence: number;
    description: string;
    suggestedAction: ResearchStrategy;
}
export interface ResearchContext {
    sessionId: string;
    originalQuery: string;
    subQueries: SubQuery[];
    results: ResearchSearchResult[];
    claims: ValidatedClaim[];
    blindSpots: BlindSpot[];
    iteration: number;
    maxIterations: number;
    minConfidence: number;
    sources: string[];
    config?: ResearchConfig;
}
export interface ResearchSearchResult {
    title: string;
    url: string;
    snippet: string;
    source: string;
    rank?: number;
    aspects?: string[];
    timestamp?: string;
}
export interface ResearchConfig {
    maxIterations: number;
    minConfidence: number;
    strategies: ResearchStrategy[];
    sources: string[];
    enableMultiModal: boolean;
    maxResultAgeDays?: number;
}
export declare const DEFAULT_RESEARCH_CONFIG: ResearchConfig;
export interface OrchestratorResult {
    sessionId: string;
    conclusion: string;
    confidence: number;
    claims: ValidatedClaim[];
    iterations: number;
    blindSpotsRemaining: BlindSpot[];
    searchResults: ResearchSearchResult[];
    durationMs: number;
    stateHistory: {
        state: ResearchState;
        timestamp: number;
    }[];
}
export interface ConfidenceConfig {
    high: number;
    medium: number;
    sourceCredibility: Record<string, number>;
    freshnessWeight: number;
    agreementWeight: number;
}
export declare const DEFAULT_CONFIDENCE_CONFIG: ConfidenceConfig;
export interface RefinementResult {
    newQueries: string[];
    adjustedStrategy?: ResearchStrategy;
    reason: string;
    expectedGain: number;
}
export interface CalibrationStats {
    falsePositiveRate: number;
    falseNegativeRate: number;
    optimalThreshold: number;
    samplesNeeded: number;
}
//# sourceMappingURL=types.d.ts.map