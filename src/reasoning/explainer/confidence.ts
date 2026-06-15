/**
 * Confidence Evaluator - Assesses confidence of reasoning results
 */

import type { ConfidenceFactors, EvidenceItem } from './types.js';

export class ConfidenceEvaluator {
  evaluate(
    evidence: EvidenceItem[],
    chainLength: number,
    sourceAuthority?: number,
  ): ConfidenceFactors {
    if (evidence.length === 0) {
      return {
        evidenceCount: 0,
        evidenceConsistency: 0,
        chainLength,
        sourceAuthority: sourceAuthority ?? 0.5,
        temporalRecency: 0.5,
        overall: 0.1,
      };
    }

    const evidenceCount = evidence.length;

    // Consistency: ratio of supporting evidence to total
    const supportingCount = evidence.filter((e) => e.supportsClaim).length;
    const evidenceConsistency = supportingCount / evidence.length;

    // Evidence score: capped at 5 pieces
    const evidenceScore = Math.min(evidenceCount / 5, 1) * 0.3;

    // Consistency score
    const consistencyScore = evidenceConsistency * 0.3;

    // Authority score
    const authorityScore = (sourceAuthority ?? 0.5) * 0.2;

    // Recency score (default 0.5 if not available)
    const recencyScore = 0.5 * 0.2;

    // Overall
    const overall = Math.round(
      (evidenceScore + consistencyScore + authorityScore + recencyScore) * 100,
    ) / 100;

    return {
      evidenceCount,
      evidenceConsistency,
      chainLength,
      sourceAuthority: sourceAuthority ?? 0.5,
      temporalRecency: 0.5,
      overall,
    };
  }

  evaluateFromResults(
    results: Array<{ confidence: number; status: string }>,
  ): ConfidenceFactors {
    if (results.length === 0) {
      return this.evaluate([], 0, 0.5);
    }

    const completed = results.filter((r) => r.status === 'completed');
    const chainLength = results.length;

    if (completed.length === 0) {
      return {
        evidenceCount: 0,
        evidenceConsistency: 0,
        chainLength,
        sourceAuthority: 0.5,
        temporalRecency: 0.5,
        overall: 0.1,
      };
    }

    const avgConfidence =
      completed.reduce((sum, r) => sum + r.confidence, 0) / completed.length;

    // Consistency: low variance in confidence
    const variance =
      completed.reduce((sum, r) => sum + Math.pow(r.confidence - avgConfidence, 2), 0) /
      completed.length;
    const evidenceConsistency = Math.max(0, 1 - variance);

    const overall = Math.round(
      (avgConfidence * 0.5 + evidenceConsistency * 0.3 + 0.5 * 0.2) * 100,
    ) / 100;

    return {
      evidenceCount: completed.length,
      evidenceConsistency,
      chainLength,
      sourceAuthority: 0.5,
      temporalRecency: 0.5,
      overall,
    };
  }
}
