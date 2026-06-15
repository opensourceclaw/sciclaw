import { describe, it, expect } from 'vitest';
import { FactCheckService, verifyClaim, verifySource } from '../../src/validation/factcheck_service.js';
import { ClaimType, VerificationStatus } from '../../src/validation/types.js';

describe('FactCheckService', () => {
  const service = new FactCheckService(1);

  it('should return PENDING for empty claim text', async () => {
    const result = await service.verifyClaim(
      { id: '1', text: '', type: ClaimType.FACTUAL, confidence: 0.5, position: 0, length: 0, metadata: {} }
    );
    expect(result.status).toBe(VerificationStatus.PENDING);
  });

  it('should return UNVERIFIABLE for opinion claims with no sources', async () => {
    const result = await service.verifyClaim(
      { id: '1', text: 'I think this is true', type: ClaimType.OPINION, confidence: 0.5, position: 0, length: 18, metadata: {} }
    );
    expect(result.status).toBe(VerificationStatus.UNVERIFIABLE);
  });

  it('should return VERIFIED with sufficient supporting sources', async () => {
    const refs = ['The earth is round and spherical in shape', 'Research confirms earth is round', 'Multiple studies show earth is round'];
    const result = await service.verifyClaim(
      { id: '1', text: 'The earth is round', type: ClaimType.FACTUAL, confidence: 0.8, position: 0, length: 17, metadata: {} },
      refs
    );
    expect(result.status).toBe(VerificationStatus.VERIFIED);
    expect(result.supportingSources).toBeGreaterThanOrEqual(2);
  });

  it('should cache results', async () => {
    const claim = { id: '1', text: 'Cache test claim', type: ClaimType.FACTUAL, confidence: 0.5, position: 0, length: 15, metadata: {} };
    const refs = ['Cache test claim reference source with extra text'];
    await service.verifyClaim(claim, refs);
    const stats = service.getCacheStats();
    expect(stats.cachedEntries).toBeGreaterThanOrEqual(1);
  });

  it('should return FALSE for contradictory numeric evidence', async () => {
    const refs = ['The official count stands at 500 units'];
    const result = await service.verifyClaim(
      { id: '1', text: 'Company reported exactly 1000 units sold', type: ClaimType.NUMERIC, confidence: 0.5, position: 0, length: 41, metadata: {} },
      refs
    );
    // Different numbers (1000 vs 500) with low text overlap → contradictory
    expect(result.status).toBe(VerificationStatus.FALSE);
  });

  it('should clear cache', async () => {
    const claim = { id: '1', text: 'Clear cache', type: ClaimType.FACTUAL, confidence: 0.5, position: 0, length: 11, metadata: {} };
    await service.verifyClaim(claim);
    service.clearCache();
    expect(service.getCacheStats().cachedEntries).toBe(0);
  });

  it('should verify multiple claims', async () => {
    const claims = [
      { id: '1', text: 'Claim one is tested', type: ClaimType.FACTUAL, confidence: 0.5, position: 0, length: 19, metadata: {} },
      { id: '2', text: 'Claim two is tested', type: ClaimType.FACTUAL, confidence: 0.5, position: 0, length: 19, metadata: {} },
    ];
    const results = await service.verifyClaims(claims);
    expect(results.length).toBe(2);
  });

  it('should compute source verification summary', async () => {
    const claims = [
      { id: '1', text: 'Earth is round', type: ClaimType.FACTUAL, confidence: 0.8, position: 0, length: 14, metadata: {} },
      { id: '2', text: 'I think maybe', type: ClaimType.OPINION, confidence: 0.3, position: 0, length: 13, metadata: {} },
    ];
    const refs = ['Earth is round and spherical', 'Earth is round confirmed by science'];
    const summary = await service.verifySource('https://example.com', claims, refs);
    expect(summary.url).toBe('https://example.com');
    expect(summary.totalClaims).toBe(2);
  });
});

describe('verifyClaim (standalone)', () => {
  it('should work as standalone function', async () => {
    const result = await verifyClaim(
      { id: '1', text: 'Test claim', type: ClaimType.FACTUAL, confidence: 0.5, position: 0, length: 10, metadata: {} }
    );
    expect(result).toBeDefined();
  });
});

describe('verifySource (standalone)', () => {
  it('should work as standalone function', async () => {
    const result = await verifySource('https://example.com', []);
    expect(result.totalClaims).toBe(0);
  });
});
