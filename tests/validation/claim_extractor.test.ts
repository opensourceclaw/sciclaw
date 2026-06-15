import { describe, it, expect } from 'vitest';
import { ClaimExtractor, extractClaims, extractNumericClaims } from '../../src/validation/claim_extractor.js';
import { ClaimType } from '../../src/validation/types.js';

describe('ClaimExtractor', () => {
  const extractor = new ClaimExtractor();

  describe('extractClaims', () => {
    it('should return empty array for empty text', () => {
      expect(extractor.extractClaims('')).toEqual([]);
      expect(extractor.extractClaims('  ')).toEqual([]);
    });

    it('should extract sentences as claims', () => {
      const text = 'The earth is round. Water boils at 100 degrees Celsius.';
      const claims = extractor.extractClaims(text);
      expect(claims.length).toBeGreaterThanOrEqual(2);
      expect(claims.every((c) => c.text.length > 0)).toBe(true);
    });

    it('should classify factual claims', () => {
      const claims = extractor.extractClaims('Research shows that exercise improves health.');
      expect(claims.length).toBeGreaterThanOrEqual(1);
      expect(claims[0]?.type).toBe(ClaimType.FACTUAL);
    });

    it('should classify numeric claims', () => {
      const claims = extractor.extractClaims('GDP grew by 3.5% in the last quarter.');
      expect(claims.length).toBeGreaterThanOrEqual(1);
      expect(claims[0]?.type).toBe(ClaimType.NUMERIC);
    });

    it('should classify quotation claims', () => {
      const claims = extractor.extractClaims('The CEO stated "We are committed to sustainability initiatives across all operations."');
      expect(claims.length).toBeGreaterThanOrEqual(1);
      expect(claims[0]?.type).toBe(ClaimType.QUOTATION);
    });

    it('should classify comparison claims', () => {
      const claims = extractor.extractClaims('Company A grew faster than Company B in revenue.');
      expect(claims.length).toBeGreaterThanOrEqual(1);
      expect(claims[0]?.type).toBe(ClaimType.COMPARISON);
    });

    it('should classify causation claims', () => {
      const claims = extractor.extractClaims('Smoking causes lung cancer according to medical research.');
      expect(claims.length).toBeGreaterThanOrEqual(1);
      expect(claims[0]?.type).toBe(ClaimType.CAUSATION);
    });

    it('should classify opinion claims', () => {
      const claims = extractor.extractClaims('I think this is the best movie ever made.');
      expect(claims.length).toBeGreaterThanOrEqual(1);
      expect(claims[0]?.type).toBe(ClaimType.OPINION);
    });

    it('should include source URL and title when provided', () => {
      const claims = extractor.extractClaims('The sky is blue.', 'https://example.com', 'Example Site');
      expect(claims[0]?.sourceUrl).toBe('https://example.com');
      expect(claims[0]?.sourceTitle).toBe('Example Site');
    });

    it('should skip very short sentences', () => {
      const claims = extractor.extractClaims('Hi. OK. The system is working fine.');
      expect(claims.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('extractNumericClaims', () => {
    it('should extract percentage values', () => {
      const result = extractor.extractNumericClaims('Growth rate is 15.5%');
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.some((n) => n.unit === 'percentage')).toBe(true);
    });

    it('should extract large numbers with units', () => {
      const result = extractor.extractNumericClaims('The budget is 5 million dollars');
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('should extract measurements', () => {
      const result = extractor.extractNumericClaims('Distance is 100 km');
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array for text without numbers', () => {
      const result = extractor.extractNumericClaims('The system is working fine.');
      expect(result).toEqual([]);
    });
  });

  describe('getStatistics', () => {
    it('should return zeros for empty claims', () => {
      const stats = extractor.getStatistics([]);
      expect(stats.totalClaims).toBe(0);
      expect(stats.averageConfidence).toBe(0);
    });

    it('should calculate statistics for claims', () => {
      const claims = extractor.extractClaims('GDP grew 5%. Research shows exercise helps.');
      const stats = extractor.getStatistics(claims);
      expect(stats.totalClaims).toBeGreaterThan(0);
      expect(stats.averageConfidence).toBeGreaterThan(0);
      expect(Object.keys(stats.byType).length).toBeGreaterThan(0);
    });
  });
});

describe('extractClaims (standalone)', () => {
  it('should work as standalone function', () => {
    const claims = extractClaims('The earth orbits the sun.');
    expect(claims.length).toBeGreaterThanOrEqual(1);
  });
});
