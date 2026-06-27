/**
 * DeepClaw v3.3.0 — Orchestrator Types
 *
 * Core type definitions for Research State Machine, Dynamic Planner,
 * Cross-Validation, Blind Spot Detection, and Iterative Refinement.
 */

// ── Research State Machine ────────────────────────────────────────────

/** States in the research lifecycle. */
export enum ResearchState {
  PLAN = "plan",
  SEARCH = "search",
  ANALYZE = "analyze",
  REFINE = "refine",
  DONE = "done",
  ABORTED = "aborted",
}

/** Search strategies the Dynamic Planner can choose. */
export enum ResearchStrategy {
  BREADTH_FIRST = "breadth-first",
  DEPTH_FIRST = "depth-first",
  TREE_SEARCH = "tree-search",
  PIVOT = "pivot",
}

// ── Sub-query ─────────────────────────────────────────────────────────

export interface SubQuery {
  id: string;
  query: string;
  aspect: string;
  sources: string[];
  priority: number;
}

// ── Claims & Validation ───────────────────────────────────────────────

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

// ── Blind Spots ───────────────────────────────────────────────────────

export type BlindSpotReason =
  | "uncovered"
  | "contradiction"
  | "shallow"
  | "stale";

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

// ── Pivot ─────────────────────────────────────────────────────────────

export interface PivotSignal {
  type: "low_relevance" | "contradiction" | "information_gain_drop" | "new_aspect";
  confidence: number;
  description: string;
  suggestedAction: ResearchStrategy;
}

// ── Research Context & Config ─────────────────────────────────────────

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

export const DEFAULT_RESEARCH_CONFIG: ResearchConfig = {
  maxIterations: 5,
  minConfidence: 0.6,
  strategies: [ResearchStrategy.BREADTH_FIRST],
  sources: ["duckduckgo"],
  enableMultiModal: false,
  maxResultAgeDays: 365,
};

// ── Research Result ───────────────────────────────────────────────────

export interface OrchestratorResult {
  sessionId: string;
  conclusion: string;
  confidence: number;
  claims: ValidatedClaim[];
  iterations: number;
  blindSpotsRemaining: BlindSpot[];
  searchResults: ResearchSearchResult[];
  durationMs: number;
  stateHistory: { state: ResearchState; timestamp: number }[];
}

// ── Confidence Config ─────────────────────────────────────────────────

export interface ConfidenceConfig {
  high: number;
  medium: number;
  sourceCredibility: Record<string, number>;
  freshnessWeight: number;
  agreementWeight: number;
}

export const DEFAULT_CONFIDENCE_CONFIG: ConfidenceConfig = {
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

// ── Refinement ────────────────────────────────────────────────────────

export interface RefinementResult {
  newQueries: string[];
  adjustedStrategy?: ResearchStrategy;
  reason: string;
  expectedGain: number;
}

// ── Calibration ───────────────────────────────────────────────────────

export interface CalibrationStats {
  falsePositiveRate: number;
  falseNegativeRate: number;
  optimalThreshold: number;
  samplesNeeded: number;
}
