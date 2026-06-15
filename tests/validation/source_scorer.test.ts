import { describe, it, expect } from 'vitest';
import { DomainScorer, FreshnessScorer, SourceScorer, scoreSource } from '../../src/validation/source_scorer.js';

describe('DomainScorer', () => {
  const scorer = new DomainScorer();

  it('should return high reputation for known academic domains', () => {
    const result = scorer.scoreDomain('https://arxiv.org/abs/1234');
    expect(result.reputation).toBeGreaterThan(0.8);
    expect(result.category).not.toBe('unknown');
  });

  it('should return medium reputation for news domains', () => {
    const result = scorer.scoreDomain('https://reuters.com/article');
    expect(result.reputation).toBeGreaterThanOrEqual(0.6);
    expect(result.reputation).toBeLessThanOrEqual(0.85);
  });

  it('should return lower reputation for unknown domains', () => {
    const result = scorer.scoreDomain('https://random-unknown-site.xyz/page');
    expect(result.reputation).toBeLessThanOrEqual(0.55);
    expect(result.category).toBe('unknown');
  });

  it('should handle invalid URL gracefully', () => {
    const result = scorer.scoreDomain('not-a-url');
    expect(typeof result.reputation).toBe('number');
    expect(result.reputation).toBeLessThanOrEqual(1);
  });

  it('should detect educational TLDs', () => {
    const result = scorer.scoreDomain('https://example.edu/article');
    expect(result.category).toBe('educational');
    expect(result.reputation).toBeGreaterThanOrEqual(0.7);
  });
});

describe('FreshnessScorer', () => {
  const scorer = new FreshnessScorer();

  it('should return high score for recent ISO dates', () => {
    const result = scorer.scoreFreshness(new Date().toISOString());
    expect(result.score).toBeGreaterThanOrEqual(0.9);
  });

  it('should return decreasing scores for older dates', () => {
    const recent = scorer.scoreFreshness(new Date().toISOString());
    const old = scorer.scoreFreshness('2020-01-01');
    expect(recent.score).toBeGreaterThan(old.score);
  });

  it('should return 0.1 for very old dates', () => {
    const result = scorer.scoreFreshness('1900-01-01');
    expect(result.score).toBe(0.1);
  });

  it('should return 0.5 when no date provided', () => {
    const result = scorer.scoreFreshness();
    expect(result.score).toBe(0.5);
  });
});

describe('SourceScorer', () => {
  const scorer = new SourceScorer();

  it('should compute combined score from domain and freshness', () => {
    const result = scorer.scoreSource('https://reuters.com/article', new Date().toISOString());
    expect(result.overall).toBeGreaterThan(0);
    expect(result.overall).toBeLessThanOrEqual(1);
    expect(result.domain).toBeDefined();
    expect(result.freshness).toBeDefined();
  });

  it('should include authority score when provided', () => {
    const result = scorer.scoreSource('https://example.edu/research', new Date().toISOString(), 0.9);
    expect(result.overall).toBeGreaterThan(0);
  });

  it('should return 0.5 overall for empty URL with no date', () => {
    const result = scorer.scoreSource('');
    expect(result.overall).toBe(0.5);
  });
});

describe('scoreSource (standalone)', () => {
  it('should work as standalone function', () => {
    const result = scoreSource('https://example.com');
    expect(result).toBeDefined();
    expect(typeof result.overall).toBe('number');
  });
});
