import { describe, it, expect } from 'vitest';
import { RiskScorer, assessRisk } from '../../src/validation/risk_scorer.js';
import { ClaimType, RiskLevel } from '../../src/validation/types.js';

describe('RiskScorer', () => {
  it('should return LOW risk for high-confidence factual claims from trusted sources', () => {
    const scorer = new RiskScorer();
    const result = scorer.assessRisk(
      { id: '1', text: 'Test', type: ClaimType.FACTUAL, confidence: 0.9, position: 0, length: 4, metadata: {} },
      0.9,
      0.9
    );
    expect(result.level).toBe(RiskLevel.LOW);
    expect(result.overallRisk).toBeLessThan(0.25);
  });

  it('should return CRITICAL risk for low-confidence claims from untrusted sources', () => {
    const scorer = new RiskScorer();
    const result = scorer.assessRisk(
      { id: '1', text: 'Test', type: ClaimType.CAUSATION, confidence: 0.1, position: 0, length: 4, metadata: {} },
      0.1,
      0.1
    );
    expect(result.level).toBe(RiskLevel.CRITICAL);
    expect(result.overallRisk).toBeGreaterThanOrEqual(0.65);
  });

  it('should calculate risk based on claim type', () => {
    const scorer = new RiskScorer();
    const opinion = scorer.assessRisk(
      { id: '1', text: 'Test', type: ClaimType.OPINION, confidence: 0.5, position: 0, length: 4, metadata: {} },
      0.5
    );
    const factual = scorer.assessRisk(
      { id: '1', text: 'Test', type: ClaimType.FACTUAL, confidence: 0.5, position: 0, length: 4, metadata: {} },
      0.5
    );
    expect(opinion.overallRisk).toBeGreaterThan(factual.overallRisk);
  });

  it('should generate warnings for critical risk', () => {
    const scorer = new RiskScorer();
    const result = scorer.assessRisk(
      { id: '1', text: 'Test', type: ClaimType.CAUSATION, confidence: 0.1, position: 0, length: 4, sourceUrl: undefined, metadata: {} },
      0.1,
      0.1
    );
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
    expect(result.warnings.some((w) => w.includes('Untrusted source'))).toBe(true);
  });

  it('should generate recommendations for high risk', () => {
    const scorer = new RiskScorer();
    const result = scorer.assessRisk(
      { id: '1', text: 'Test', type: ClaimType.NUMERIC, confidence: 0.2, position: 0, length: 4, sourceUrl: undefined, metadata: {} },
      0.2,
      0.2
    );
    expect(result.recommendations.length).toBeGreaterThanOrEqual(1);
  });

  it('should warn about missing source attribution', () => {
    const scorer = new RiskScorer();
    const result = scorer.assessRisk(
      { id: '1', text: 'Test', type: ClaimType.FACTUAL, confidence: 0.5, position: 0, length: 4, metadata: {} },
      0.5,
      0.5
    );
    expect(result.warnings.some((w) => w.includes('Missing source'))).toBe(true);
  });

  it('should warn about low verification score', () => {
    const scorer = new RiskScorer();
    const result = scorer.assessRisk(
      { id: '1', text: 'Test', type: ClaimType.FACTUAL, confidence: 0.5, position: 0, length: 4, sourceUrl: 'https://example.com', metadata: {} },
      0.5,
      0.2
    );
    expect(result.warnings.some((w) => w.includes('not been verified'))).toBe(true);
  });

  it('should warn about causation claims', () => {
    const scorer = new RiskScorer();
    const result = scorer.assessRisk(
      { id: '1', text: 'Test', type: ClaimType.CAUSATION, confidence: 0.5, position: 0, length: 4, sourceUrl: 'https://example.com', metadata: {} },
      0.5,
      0.5
    );
    expect(result.warnings.some((w) => w.includes('causal'))).toBe(true);
  });

  it('should reject invalid weights', () => {
    expect(() => new RiskScorer({ source: 0.5, claim: 0.5, verification: 0.5 })).toThrow();
  });

  it('should handle edge case with score 0', () => {
    const scorer = new RiskScorer();
    const result = scorer.assessRisk(
      { id: '1', text: 'Test', type: ClaimType.FACTUAL, confidence: 0, position: 0, length: 4, metadata: {} },
      0,
      0
    );
    expect(result.overallRisk).toBeGreaterThanOrEqual(0);
  });

  it('should handle edge case with score 1', () => {
    const scorer = new RiskScorer();
    const result = scorer.assessRisk(
      { id: '1', text: 'Test', type: ClaimType.FACTUAL, confidence: 1, position: 0, length: 4, metadata: {} },
      1,
      1
    );
    expect(result.overallRisk).toBeLessThanOrEqual(1);
  });

  it('should get risk level for specific scores', () => {
    const scorer = new RiskScorer();
    expect(scorer.getRiskLevel(0.1)).toBe(RiskLevel.LOW);
    expect(scorer.getRiskLevel(0.3)).toBe(RiskLevel.MEDIUM);
    expect(scorer.getRiskLevel(0.5)).toBe(RiskLevel.HIGH);
    expect(scorer.getRiskLevel(0.7)).toBe(RiskLevel.CRITICAL);
  });
});

describe('assessRisk (standalone)', () => {
  it('should work as standalone function', () => {
    const result = assessRisk(
      { id: '1', text: 'Test', type: ClaimType.FACTUAL, confidence: 0.8, position: 0, length: 4, metadata: {} },
      0.8
    );
    expect(result).toBeDefined();
    expect(result.level).toBeDefined();
  });
});
