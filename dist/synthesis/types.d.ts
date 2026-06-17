/**
 * DeepClaw v3.0.0-beta.3 — Synthesis Engine Types
 *
 * Cross-domain synthesis, iterative verification, and discovery loop
 * type definitions.
 */
export interface DomainConnection {
    source: string;
    target: string;
    type: "analogy" | "causation" | "correlation" | "implication";
    strength: number;
    evidence: string[];
}
export interface CrossDomainInsight {
    id: string;
    statement: string;
    domains: string[];
    confidence: number;
    supportingConnections: string[];
}
export interface CrossDomainResult {
    domains: string[];
    connections: DomainConnection[];
    insights: CrossDomainInsight[];
    confidence: number;
}
export interface VerificationIteration {
    round: number;
    test: string;
    result: "pass" | "fail" | "partial";
    evidence: string[];
    refinement: string;
}
export interface VerificationLoop {
    hypothesis: string;
    iterations: VerificationIteration[];
    conclusion: "confirmed" | "rejected" | "inconclusive";
    confidence: number;
}
export interface DiscoveredPattern {
    id: string;
    name: string;
    description: string;
    domains: string[];
    strength: number;
    supportingEvidence: string[];
    firstSeen: Date;
}
export interface ResearchGap {
    id: string;
    domain: string;
    topic: string;
    description: string;
    priority: "low" | "medium" | "high";
    relatedFindings: string[];
}
export interface DiscoveryResult {
    patterns: DiscoveredPattern[];
    gaps: ResearchGap[];
    summary: string;
    timestamp: Date;
}
export interface DomainEvidence {
    domain: string;
    claims: string[];
    sources: string[];
    keyTerms: string[];
}
//# sourceMappingURL=types.d.ts.map