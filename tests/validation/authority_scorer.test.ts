import { describe, it, expect } from 'vitest';
import { AuthorityScorer, scoreAuthority } from '../../src/validation/authority_scorer.js';

describe('AuthorityScorer', () => {
  const scorer = new AuthorityScorer();

  it('should score top-tier institutions higher than unknown', () => {
    const mit = scorer.scoreAuthority('Test Author', 'MIT');
    const unknown = scorer.scoreAuthority('Author', 'Some Small College');
    expect(mit.score).toBeGreaterThan(unknown.score);
  });

  it('should score known institutions higher than unknown', () => {
    const known = scorer.scoreAuthority('Author', 'Stanford University');
    const unknown = scorer.scoreAuthority('Author', 'Some Small College');
    expect(known.score).toBeGreaterThan(unknown.score);
  });

  it('should detect academic institutions', () => {
    const result = scorer.scoreAuthority('Author', 'Some University');
    expect(result.score).toBeGreaterThan(0.3);
  });

  it('should detect research institutions', () => {
    const result = scorer.scoreAuthority('Author', 'Research Lab');
    expect(result.score).toBeGreaterThan(0.3);
  });

  it('should score well-known authors higher than unknown', () => {
    const known = scorer.scoreAuthority('Geoffrey Hinton', 'University of Toronto');
    const unknown = scorer.scoreAuthority('John Doe', 'Unknown College');
    expect(known.score).toBeGreaterThan(unknown.score);
  });

  it('should score high citation counts highly', () => {
    const high = scorer.scoreAuthority('Author', 'University', 10000);
    const low = scorer.scoreAuthority('Author', 'University', 0);
    expect(high.score).toBeGreaterThan(low.score);
  });

  it('should handle missing author and institution', () => {
    const result = scorer.scoreAuthority(undefined, undefined);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(0.5);
  });

  it('should report high score for highly cited known author', () => {
    const result = scorer.scoreAuthority('Geoffrey Hinton', 'MIT', 10000);
    expect(result.score).toBeGreaterThan(0.5);
  });
});

describe('scoreAuthority (standalone)', () => {
  it('should work as standalone function', () => {
    const result = scoreAuthority('Test Author', 'MIT');
    expect(result).toBeDefined();
    expect(typeof result.score).toBe('number');
  });
});
