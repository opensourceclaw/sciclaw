/**
 * SciClaw v3.0.0-beta.3 — Synthesis Engine Types
 *
 * Cross-domain synthesis, iterative verification, and discovery loop
 * type definitions.
 */

// ── Cross-Domain Synthesis ──────────────────────────────────────────

export interface DomainConnection {
  source: string;
  target: string;
  type: "analogy" | "causation" | "correlation" | "implication";
  strength: number; // 0.0–1.0
  evidence: string[];
}

export interface CrossDomainInsight {
  id: string;
  statement: string;
  domains: string[];
  confidence: number; // 0.0–1.0
  supportingConnections: string[]; // indices into DomainConnection[]
}

export interface CrossDomainResult {
  domains: string[];
  connections: DomainConnection[];
  insights: CrossDomainInsight[];
  confidence: number; // overall synthesis confidence 0.0–1.0
}

// ── Iterative Verification ──────────────────────────────────────────

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

// ── Discovery Loop ──────────────────────────────────────────────────

export interface DiscoveredPattern {
  id: string;
  name: string;
  description: string;
  domains: string[];
  strength: number; // 0.0–1.0
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

// ── Shared ───────────────────────────────────────────────────────────

export interface DomainEvidence {
  domain: string;
  claims: string[];
  sources: string[];
  keyTerms: string[];
}
