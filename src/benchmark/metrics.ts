import type { VerificationResult } from "../validation/types.js";
import { VerificationStatus } from "../validation/types.js";
import type { BenchmarkScore } from "./types.js";

function overlapRatio(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  for (const w of wordsA) if (wordsB.has(w)) intersection++;
  return intersection / Math.max(wordsA.size, wordsB.size);
}

export function computeFactuality(
  verified: VerificationResult[],
  expectedFacts: string[]
): number {
  if (expectedFacts.length === 0) return 1.0;

  const verifiedTexts = verified
    .filter((v) => v.status === VerificationStatus.VERIFIED)
    .map((v) => v.claim.text.toLowerCase());

  let matches = 0;
  for (const fact of expectedFacts) {
    const factLower = fact.toLowerCase();
    if (verifiedTexts.some((t) => t.includes(factLower) || overlapRatio(t, factLower) >= 0.5)) {
      matches++;
    }
  }
  return matches / expectedFacts.length;
}

export function computeCompleteness(
  sources: string[],
  actualSections: number,
  expectedSources: string[],
  minSections: number
): number {
  if (expectedSources.length === 0 && minSections === 0) return 1.0;

  const sourceCoverage = expectedSources.length > 0
    ? expectedSources.filter((es) => sources.some((s) => s.includes(es))).length / expectedSources.length
    : 1.0;

  const sectionCoverage = minSections > 0
    ? Math.min(1.0, actualSections / minSections)
    : 1.0;

  return sourceCoverage * 0.6 + sectionCoverage * 0.4;
}

export function computeCitationQuality(citations: Array<{ sourceId?: string; url?: string; qualityScore?: number; domain?: string }>): number {
  if (citations.length === 0) return 0.0;

  let score = 0.0;
  if (citations.every((c) => c.sourceId && c.sourceId.length === 8)) score += 0.2;
  if (citations.every((c) => c.url)) score += 0.2;
  if (citations.every((c) => (c.qualityScore ?? 0) >= 0.5)) score += 0.2;
  if (citations.length >= 3) score += 0.2;

  const uniqueDomains = new Set(citations.map((c) => c.domain).filter(Boolean));
  if (uniqueDomains.size >= 2) score += 0.2;

  return Math.round(score * 1000) / 1000;
}

export function computeReasoningDepth(longestPathLength: number, crossReferenceCount: number): number {
  let score = 0.0;

  if (longestPathLength > 0) {
    score += Math.min(longestPathLength / 3, 1.0) * 0.7;
  }

  if (crossReferenceCount > 0) {
    score += Math.min(crossReferenceCount / 5, 1.0) * 0.3;
  }

  return Math.round(score * 1000) / 1000;
}

export function computeOverall(scores: { factuality: number; completeness: number; citation: number; reasoning: number }, weights: {
  factuality: number;
  completeness: number;
  citation: number;
  reasoning: number;
}): number {
  const total = (
    scores.factuality * weights.factuality +
    scores.completeness * weights.completeness +
    scores.citation * weights.citation +
    scores.reasoning * weights.reasoning
  );
  return Math.round(total * 1000) / 1000;
}
