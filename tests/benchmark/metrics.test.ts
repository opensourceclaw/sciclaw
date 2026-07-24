import { describe, it, expect } from 'vitest';
import {
  computeFactuality,
  computeCompleteness,
  computeCitationQuality,
  computeReasoningDepth,
  computeOverall,
} from '../../src/benchmark/metrics.js';
import { VerificationStatus } from '@deepclaw/core';

describe('Benchmark Metrics', () => {
  describe('computeFactuality', () => {
    it('should return 1.0 when all facts match', () => {
      const verified = [
        { claim: { text: 'Earth is round', type: 'factual', confidence: 0.9, position: 0, length: 14, id: '1', metadata: {} }, status: VerificationStatus.VERIFIED, confidence: 0.9, sourceCount: 2, supportingSources: 2, contradictingSources: 0, checkedAt: new Date(), notes: '' },
      ];
      const result = computeFactuality(verified, ['Earth is round']);
      expect(result).toBe(1.0);
    });

    it('should return 0.0 when no facts match', () => {
      const result = computeFactuality([], ['unmatched fact']);
      expect(result).toBe(0.0);
    });

    it('should return 1.0 for empty expected facts', () => {
      const result = computeFactuality([], []);
      expect(result).toBe(1.0);
    });
  });

  describe('computeCompleteness', () => {
    it('should return 1.0 with all sources and sections', () => {
      const result = computeCompleteness(
        ['https://wikipedia.org/article', 'https://example.com'],
        4,
        ['wikipedia.org'],
        3
      );
      expect(result).toBeGreaterThan(0.8);
    });

    it('should return 0.0 with no sources and expected', () => {
      const result = computeCompleteness([], 0, ['missing.org'], 1);
      expect(result).toBe(0.0);
    });

    it('should return 1.0 for empty expected sources and sections', () => {
      const result = computeCompleteness([], 0, [], 0);
      expect(result).toBe(1.0);
    });
  });

  describe('computeCitationQuality', () => {
    it('should return high score for valid citations', () => {
      const citations = [
        { sourceId: 'abcd1234', url: 'https://example.com', qualityScore: 0.8, domain: 'example.com' },
        { sourceId: 'efgh5678', url: 'https://other.org', qualityScore: 0.7, domain: 'other.org' },
        { sourceId: 'ijkl9012', url: 'https://third.io', qualityScore: 0.9, domain: 'third.io' },
      ];
      const result = computeCitationQuality(citations);
      expect(result).toBeGreaterThanOrEqual(0.6);
    });

    it('should return 0.0 for no citations', () => {
      const result = computeCitationQuality([]);
      expect(result).toBe(0.0);
    });
  });

  describe('computeReasoningDepth', () => {
    it('should return > 0 with graph path', () => {
      const result = computeReasoningDepth(3, 0);
      expect(result).toBeGreaterThan(0);
    });

    it('should return 0.0 without graph or cross-references', () => {
      const result = computeReasoningDepth(0, 0);
      expect(result).toBe(0.0);
    });

    it('should incorporate cross-reference bonus', () => {
      const withRefs = computeReasoningDepth(0, 5);
      const withoutRefs = computeReasoningDepth(0, 0);
      expect(withRefs).toBeGreaterThan(withoutRefs);
    });
  });

  describe('computeOverall', () => {
    it('should compute weighted average correctly', () => {
      const result = computeOverall(
        { factuality: 0.8, completeness: 0.6, citation: 0.7, reasoning: 0.5 },
        { factuality: 0.4, completeness: 0.3, citation: 0.2, reasoning: 0.1 }
      );
      const expected = Math.round((0.8 * 0.4 + 0.6 * 0.3 + 0.7 * 0.2 + 0.5 * 0.1) * 1000) / 1000;
      expect(result).toBe(expected);
    });
  });
});
