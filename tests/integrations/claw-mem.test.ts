import { describe, it, expect } from 'vitest';
import { MemoryIntegration, getMemory } from '../../src/integrations/claw-mem.js';
import type { ResearchSession } from '../../src/integrations/types.js';

describe('MemoryIntegration', () => {
  let memory: MemoryIntegration;

  beforeEach(() => {
    memory = new MemoryIntegration(10);
  });

  describe('saveResearchSession', () => {
    it('should save a research session', async () => {
      const session: ResearchSession = {
        id: 'test-1',
        query: 'AI trends',
        results: [{ title: 'Test', url: 'https://example.com', snippet: 'Test' }],
        timestamp: Date.now(),
      };

      await memory.saveResearchSession(session);
      const loaded = await memory.loadResearchHistory('test-1');

      expect(loaded).toEqual(session);
    });

    it('should evict oldest session when at capacity', async () => {
      for (let i = 0; i < 11; i++) {
        await memory.saveResearchSession({
          id: `session-${i}`,
          query: `Query ${i}`,
          results: [],
          timestamp: Date.now(),
        });
      }

      const ids = await memory.getSessionIds();
      expect(ids.length).toBe(10);
      expect(ids).not.toContain('session-0');
    });
  });

  describe('searchSessions', () => {
    it('should search sessions by query', async () => {
      await memory.saveResearchSession({
        id: '1',
        query: 'Machine Learning',
        results: [],
        timestamp: Date.now(),
      });
      await memory.saveResearchSession({
        id: '2',
        query: 'Deep Learning',
        results: [],
        timestamp: Date.now(),
      });

      const results = await memory.searchSessions('learning');
      expect(results.length).toBe(2);
    });
  });

  describe('deleteSession', () => {
    it('should delete a session', async () => {
      await memory.saveResearchSession({
        id: 'test',
        query: 'Test',
        results: [],
        timestamp: Date.now(),
      });

      const deleted = await memory.deleteSession('test');
      expect(deleted).toBe(true);

      const loaded = await memory.loadResearchHistory('test');
      expect(loaded).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return statistics', async () => {
      await memory.saveResearchSession({
        id: '1',
        query: 'Test',
        results: [],
        timestamp: Date.now(),
      });

      const stats = memory.getStats();
      expect(stats.total).toBe(1);
      expect(stats.maxSessions).toBe(10);
    });
  });
});

describe('getMemory', () => {
  it('should return singleton instance', () => {
    const m1 = getMemory();
    const m2 = getMemory();
    expect(m1).toBe(m2);
  });
});
