import { RiskLevel, ClaimType } from "./types.js";
const CLAIM_TYPE_RISK = {
    [ClaimType.FACTUAL]: 0.1,
    [ClaimType.NUMERIC]: 0.2,
    [ClaimType.QUOTATION]: 0.15,
    [ClaimType.COMPARISON]: 0.3,
    [ClaimType.CAUSATION]: 0.5,
    [ClaimType.OPINION]: 0.7,
};
function clamp(v) {
    return Math.max(0, Math.min(1, v));
}
export class RiskScorer {
    sourceWeight;
    claimWeight;
    verificationWeight;
    constructor(weights) {
        this.sourceWeight = weights?.source ?? 0.3;
        this.claimWeight = weights?.claim ?? 0.3;
        this.verificationWeight = weights?.verification ?? 0.4;
        const total = this.sourceWeight + this.claimWeight + this.verificationWeight;
        if (Math.abs(total - 1.0) > 0.001) {
            throw new Error(`Weights must sum to 1.0, got ${total}`);
        }
    }
    assessRisk(claim, sourceScore, verificationScore = 0.5) {
        sourceScore = clamp(sourceScore);
        verificationScore = clamp(verificationScore);
        const claimTypeRisk = CLAIM_TYPE_RISK[claim.type] ?? 0.5;
        const claimComponent = (1 - claim.confidence) * 0.6 + claimTypeRisk * 0.4;
        const overallRisk = (1 - sourceScore) * this.sourceWeight +
            claimComponent * this.claimWeight +
            (1 - verificationScore) * this.verificationWeight;
        const clampedRisk = clamp(Math.round(overallRisk * 1000) / 1000);
        const level = this.getRiskLevel(clampedRisk);
        const warnings = this.generateWarnings(claim, sourceScore, verificationScore, level);
        const recommendations = this.generateRecommendations(claim, sourceScore, level);
        return { claim, sourceScore, claimTypeRisk, verificationScore, overallRisk: clampedRisk, level, warnings, recommendations };
    }
    getRiskLevel(score) {
        if (score >= 0.65)
            return RiskLevel.CRITICAL;
        if (score >= 0.45)
            return RiskLevel.HIGH;
        if (score >= 0.25)
            return RiskLevel.MEDIUM;
        return RiskLevel.LOW;
    }
    generateWarnings(claim, sourceScore, verificationScore, level) {
        const warnings = [];
        if (level === RiskLevel.CRITICAL)
            warnings.push("Untrusted source detected — verify independently");
        else if (level === RiskLevel.HIGH)
            warnings.push("Low-quality source — cross-reference recommended");
        if (sourceScore < 0.4)
            warnings.push(`Source reliability is low (${sourceScore.toFixed(2)})`);
        if (verificationScore < 0.3)
            warnings.push("Claim has not been verified");
        if (claim.type === ClaimType.OPINION)
            warnings.push("Subjective claim — may not be factual");
        if (claim.type === ClaimType.CAUSATION)
            warnings.push("Causation claim — verify causal relationship");
        if (!claim.sourceUrl)
            warnings.push("Missing source attribution");
        return warnings;
    }
    generateRecommendations(claim, sourceScore, level) {
        const recs = [];
        if (level === RiskLevel.HIGH || level === RiskLevel.CRITICAL) {
            recs.push("Seek confirmation from at least 2 independent sources");
        }
        if (sourceScore < 0.4)
            recs.push("Replace with more reliable source if available");
        if (claim.type === ClaimType.NUMERIC)
            recs.push("Verify numbers against original source data");
        if (claim.type === ClaimType.CAUSATION)
            recs.push("Check for correlation vs causation fallacy");
        return recs;
    }
}
export function assessRisk(claim, sourceScore, verificationScore) {
    const scorer = new RiskScorer();
    return scorer.assessRisk(claim, sourceScore, verificationScore);
}
//# sourceMappingURL=risk_scorer.js.map