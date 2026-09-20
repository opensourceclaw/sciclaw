/**
 * SciClaw v3.0.0 — Hypothesis Generation Types
 */

// ── Enums ────────────────────────────────────────────────────────────────

export enum HypothesisStatus {
  PROPOSED = "proposed",
  SUPPORTED = "supported",
  REFUTED = "refuted",
  INCONCLUSIVE = "inconclusive",
}

export enum EvidenceStrength {
  STRONG = "strong",
  MODERATE = "moderate",
  WEAK = "weak",
  NEGLIGIBLE = "negligible",
}

export enum HypothesisCategory {
  CAUSAL = "causal",
  CORRELATIONAL = "correlational",
  EXPLANATORY = "explanatory",
  PREDICTIVE = "predictive",
  COMPARATIVE = "comparative",
}

// ── Evidence ─────────────────────────────────────────────────────────────

export interface Evidence {
  id: string;
  source: string;
  content: string;
  relevance: number;
  reliability: number;
  type: "fact" | "observation" | "data_point" | "expert_opinion";
  timestamp: Date;
}

// ── Hypothesis ───────────────────────────────────────────────────────────

export interface Hypothesis {
  id: string;
  statement: string;
  category: HypothesisCategory;
  supportingEvidence: Evidence[];
  contradictingEvidence: Evidence[];
  confidence: number;
  status: HypothesisStatus;
  parentHypothesis?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RankedHypothesis {
  hypothesis: Hypothesis;
  rank: number;
  score: number;
  confidence: number;
  strengthLabel: EvidenceStrength;
}

export interface ValidationResult {
  hypothesisId: string;
  feasible: boolean;
  testable: boolean;
  falsifiable: boolean;
  novelty: number;
  clarity: number;
  issues: ValidationIssue[];
  overallScore: number;
}

export interface ValidationIssue {
  severity: "error" | "warning" | "info";
  message: string;
  field?: string;
}

// ── Config ────────────────────────────────────────────────────────────────

export interface RankingWeights {
  evidenceSupport: number;
  evidenceReliability: number;
  novelty: number;
  testability: number;
  coherence: number;
}

export interface ValidationThresholds {
  minFeasibility: number;
  minClarity: number;
  minNovelty: number;
}

export interface HypothesisConfig {
  minHypotheses: number;
  maxHypotheses: number;
  minEvidencePerHypothesis: number;
  rankingWeights: RankingWeights;
  validationThresholds: ValidationThresholds;
}

export const DEFAULT_HYPOTHESIS_CONFIG: HypothesisConfig = {
  minHypotheses: 3,
  maxHypotheses: 10,
  minEvidencePerHypothesis: 1,
  rankingWeights: {
    evidenceSupport: 0.4,
    evidenceReliability: 0.25,
    novelty: 0.15,
    testability: 0.1,
    coherence: 0.1,
  },
  validationThresholds: {
    minFeasibility: 0.3,
    minClarity: 0.4,
    minNovelty: 0.1,
  },
};
