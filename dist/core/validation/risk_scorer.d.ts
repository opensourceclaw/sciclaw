import type { Claim, RiskAssessment } from "./types.js";
import { RiskLevel } from "./types.js";
export declare class RiskScorer {
    private sourceWeight;
    private claimWeight;
    private verificationWeight;
    constructor(weights?: {
        source?: number;
        claim?: number;
        verification?: number;
    });
    assessRisk(claim: Claim, sourceScore: number, verificationScore?: number): RiskAssessment;
    getRiskLevel(score: number): RiskLevel;
    private generateWarnings;
    private generateRecommendations;
}
export declare function assessRisk(claim: Claim, sourceScore: number, verificationScore?: number): RiskAssessment;
//# sourceMappingURL=risk_scorer.d.ts.map