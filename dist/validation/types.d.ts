export declare enum ClaimType {
    FACTUAL = "factual",
    NUMERIC = "numeric",
    QUOTATION = "quotation",
    COMPARISON = "comparison",
    CAUSATION = "causation",
    OPINION = "opinion"
}
export declare enum RiskLevel {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum CitationStyle {
    APA = "apa",
    MLA = "mla",
    CHICAGO = "chicago"
}
export declare enum VerificationStatus {
    VERIFIED = "verified",
    FALSE = "false",
    PARTIALLY_TRUE = "partially_true",
    UNVERIFIABLE = "unverifiable",
    PENDING = "pending"
}
export interface NumericClaim {
    value: number;
    unit: string;
    context: string;
    position: number;
    originalText: string;
}
export interface Claim {
    id: string;
    text: string;
    type: ClaimType;
    confidence: number;
    position: number;
    length: number;
    sourceUrl?: string;
    sourceTitle?: string;
    numericData?: NumericClaim;
    dates: string[];
    metadata: Record<string, unknown>;
}
export interface DomainScore {
    domain: string;
    reputation: number;
    category: string;
}
export interface FreshnessScore {
    score: number;
    daysSincePublished: number;
    publishedDate?: string;
    category: string;
}
export interface SourceScore {
    domain: DomainScore;
    freshness: FreshnessScore;
    authority: AuthorityScore;
    overall: number;
}
export interface AuthorityScore {
    score: number;
    authorName?: string;
    institution?: string;
    citationCount?: number;
    hasCredentials: boolean;
}
export interface RiskAssessment {
    claim: Claim;
    sourceScore: number;
    claimTypeRisk: number;
    verificationScore: number;
    overallRisk: number;
    level: RiskLevel;
    warnings: string[];
    recommendations: string[];
}
export interface Citation {
    url: string;
    title: string;
    sourceId: string;
    domain: string;
    publishedDate?: Date;
    accessedDate: Date;
    qualityScore: number;
    relevantSnippet: string;
    author?: string;
    siteName?: string;
    metadata: Record<string, unknown>;
}
export interface VerificationResult {
    claim: Claim;
    status: VerificationStatus;
    confidence: number;
    sourceCount: number;
    supportingSources: number;
    contradictingSources: number;
    checkedAt: Date;
    notes: string;
}
//# sourceMappingURL=types.d.ts.map