import { describe, it, expect } from 'vitest';
import { ConfidenceEvaluator } from '../../../src/reasoning/explainer/confidence.js';
import type { EvidenceItem } from '../../../src/reasoning/explainer/types.js';

function makeEvidence(supportsClaim: boolean, relevance = 0.8): EvidenceItem {
  return {
    id: 'e1',
    content: 'Evidence content.',
    source: 'source-a',
    relevance,
    supportsClaim,
  };
}

describe('ConfidenceEvaluator', () => {
  const evaluator = new ConfidenceEvaluator();

  it('should evaluate confidence from evidence items', () => {
    const evidence = [
      makeEvidence(true),
      makeEvidence(true),
      makeEvidence(false),
    ];
    const factors = evaluator.evaluate(evidence, 3, 0.7);
    expect(factors.evidenceCount).toBe(3);
    expect(factors.chainLength).toBe(3);
    expect(factors.overall).toBeGreaterThan(0);
  });

  it('should return low confidence for zero evidence', () => {
    const factors = evaluator.evaluate([], 0, 0.5);
    expect(factors.overall).toBe(0.1);
    expect(factors.evidenceCount).toBe(0);
  });

  it('should return high consistency for agreeing evidence', () => {
    const evidence = [
      makeEvidence(true, 0.9),
      makeEvidence(true, 0.8),
      makeEvidence(true, 0.7),
    ];
    const factors = evaluator.evaluate(evidence, 2, 0.8);
    expect(factors.evidenceConsistency).toBe(1);
  });

  it('should return low consistency for contradictory evidence', () => {
    const evidence = [
      makeEvidence(true),
      makeEvidence(false),
      makeEvidence(false),
    ];
    const factors = evaluator.evaluate(evidence, 2, 0.5);
    expect(factors.evidenceConsistency).toBeLessThan(0.5);
  });

  it('should evaluate from step results', () => {
    const results = [
      { confidence: 0.9, status: 'completed' },
      { confidence: 0.7, status: 'completed' },
    ];
    const factors = evaluator.evaluateFromResults(results);
    expect(factors.chainLength).toBe(2);
    expect(factors.overall).toBeGreaterThan(0);
  });

  it('should return low confidence for empty results', () => {
    const factors = evaluator.evaluateFromResults([]);
    expect(factors.overall).toBe(0.1);
  });

  it('should return low confidence for all-failed results', () => {
    const results = [
      { confidence: 0, status: 'failed' },
      { confidence: 0, status: 'failed' },
    ];
    const factors = evaluator.evaluateFromResults(results);
    expect(factors.overall).toBe(0.1);
  });
});
