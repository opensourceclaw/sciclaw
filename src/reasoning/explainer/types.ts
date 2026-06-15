/**
 * Explainer types - Reasoning log, confidence evaluation, and explanation generation
 */

export interface LogEntry {
  timestamp: Date;
  stepNumber: number;
  subQuestion: string;
  input: unknown;
  output: unknown;
  reasoning: string;
  durationMs: number;
  confidence: number;
  level: 'info' | 'warn' | 'error';
}

export interface ConfidenceFactors {
  evidenceCount: number;
  evidenceConsistency: number;
  chainLength: number;
  sourceAuthority: number;
  temporalRecency: number;
  overall: number;
}

export interface Explanation {
  chainId: string;
  summary: string;
  steps: ExplanationStep[];
  confidence: ConfidenceFactors;
  evidence: EvidenceItem[];
  generatedAt: Date;
}

export interface ExplanationStep {
  stepNumber: number;
  claim: string;
  justification: string;
  confidence: number;
  citations: string[];
}

export interface EvidenceItem {
  id: string;
  content: string;
  source: string;
  relevance: number;
  supportsClaim: boolean;
}
