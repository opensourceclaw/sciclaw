/**
 * SciClaw v3.0.0 — Hypothesis Generation Types
 */
export declare enum HypothesisStatus {
    PROPOSED = "proposed",
    SUPPORTED = "supported",
    REFUTED = "refuted",
    INCONCLUSIVE = "inconclusive"
}
export declare enum EvidenceStrength {
    STRONG = "strong",
    MODERATE = "moderate",
    WEAK = "weak",
    NEGLIGIBLE = "negligible"
}
export declare enum HypothesisCategory {
    CAUSAL = "causal",
    CORRELATIONAL = "correlational",
    EXPLANATORY = "explanatory",
    PREDICTIVE = "predictive",
    COMPARATIVE = "comparative"
}
export interface Evidence {
    id: string;
    source: string;
    content: string;
    relevance: number;
    reliability: number;
    type: "fact" | "observation" | "data_point" | "expert_opinion";
    timestamp: Date;
}
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
export declare const DEFAULT_HYPOTHESIS_CONFIG: HypothesisConfig;
//# sourceMappingURL=types.d.ts.map