import type { Claim, VerificationResult } from "./types.js";
export interface SourceVerificationSummary {
    url: string;
    totalClaims: number;
    verified: number;
    false: number;
    partiallyTrue: number;
    unverifiable: number;
    verificationRate: number;
}
export declare class FactCheckService {
    private cacheTTL;
    private cache;
    constructor(cacheTTLMinutes?: number);
    verifyClaim(claim: Claim, referenceSources?: string[]): Promise<VerificationResult>;
    verifyClaims(claims: Claim[], referenceSources?: string[]): Promise<VerificationResult[]>;
    verifySource(url: string, claims: Claim[]): Promise<SourceVerificationSummary>;
    clearCache(): void;
    getCacheStats(): {
        cachedEntries: number;
    };
    private verifyInternal;
    private evaluate;
    private textOverlap;
    private hasSimilarNumbers;
    private cacheKey;
}
export declare function verifyClaim(claim: Claim, referenceSources?: string[]): Promise<VerificationResult>;
export declare function verifySource(url: string, claims: Claim[]): Promise<SourceVerificationSummary>;
//# sourceMappingURL=factcheck_service.d.ts.map