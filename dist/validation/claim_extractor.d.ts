import { type Claim, type NumericClaim } from "./types.js";
export declare class ClaimExtractor {
    private compiled;
    constructor();
    extractClaims(text: string, sourceUrl?: string, sourceTitle?: string): Claim[];
    extractNumericClaims(text: string): NumericClaim[];
    getStatistics(claims: Claim[]): {
        totalClaims: number;
        byType: Record<string, number>;
        averageConfidence: number;
    };
    private classifyClaim;
    private extractNumeric;
    private extractDates;
    private detectUnit;
    private getContext;
    private splitSentences;
}
export declare function extractClaims(text: string, sourceUrl?: string, sourceTitle?: string): Claim[];
export declare function extractNumericClaims(text: string): NumericClaim[];
//# sourceMappingURL=claim_extractor.d.ts.map