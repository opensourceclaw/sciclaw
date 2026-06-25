/**
 * DeepClaw v3.0.0 — Hypothesis Generation Types
 */
// ── Enums ────────────────────────────────────────────────────────────────
export var HypothesisStatus;
(function (HypothesisStatus) {
    HypothesisStatus["PROPOSED"] = "proposed";
    HypothesisStatus["SUPPORTED"] = "supported";
    HypothesisStatus["REFUTED"] = "refuted";
    HypothesisStatus["INCONCLUSIVE"] = "inconclusive";
})(HypothesisStatus || (HypothesisStatus = {}));
export var EvidenceStrength;
(function (EvidenceStrength) {
    EvidenceStrength["STRONG"] = "strong";
    EvidenceStrength["MODERATE"] = "moderate";
    EvidenceStrength["WEAK"] = "weak";
    EvidenceStrength["NEGLIGIBLE"] = "negligible";
})(EvidenceStrength || (EvidenceStrength = {}));
export var HypothesisCategory;
(function (HypothesisCategory) {
    HypothesisCategory["CAUSAL"] = "causal";
    HypothesisCategory["CORRELATIONAL"] = "correlational";
    HypothesisCategory["EXPLANATORY"] = "explanatory";
    HypothesisCategory["PREDICTIVE"] = "predictive";
    HypothesisCategory["COMPARATIVE"] = "comparative";
})(HypothesisCategory || (HypothesisCategory = {}));
export const DEFAULT_HYPOTHESIS_CONFIG = {
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
//# sourceMappingURL=types.js.map