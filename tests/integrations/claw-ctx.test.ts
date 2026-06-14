import { describe, it, expect } from 'vitest';
import { ContextIntegration, getContext } from '../../src/integrations/claw-ctx.js';

describe('ContextIntegration', () => {
  let ctx: ContextIntegration;

  beforeEach(() => {
    ctx = new ContextIntegration();
  });

  describe('createContext', () => {
    it('should create a new context', async () => {
      const context = await ctx.createContext({
        sessionId: 'test-1',
        state: { query: 'AI trends' },
      });

      expect(context.sessionId).toBe('test-1');
      expect(context.query).toBe('AI trends');
      expect(context.createdAt).toBeDefined();
      expect(context.updatedAt).toBeDefined();
    });
  });

  describe('restoreContext', () => {
    it('should restore an existing context', async () => {
      await ctx.createContext({ sessionId: 'test-1' });
      const restored = await ctx.restoreContext('test-1');

      expect(restored).toBeDefined();
      expect(restored?.sessionId).toBe('test-1');
    });

    it('should return null for non-existent context', async () => {
      const restored = await ctx.restoreContext('non-existent');
      expect(restored).toBeNull();
    });
  });

  describe('updateContext', () => {
    it('should update context state', async () => {
      await ctx.createContext({ sessionId: 'test-1' });
      const updated = await ctx.updateContext('test-1', { query: 'Updated query' });

      expect(updated?.query).toBe('Updated query');
    });

    it('should return null for non-existent context', async () => {
      const updated = await ctx.updateContext('non-existent', { query: 'Test' });
      expect(updated).toBeNull();
    });
  });

  describe('listContexts', () => {
    it('should list all context IDs', async () => {
      await ctx.createContext({ sessionId: 'ctx-1' });
      await ctx.createContext({ sessionId: 'ctx-2' });

      const ids = await ctx.listContexts();
      expect(ids).toContain('ctx-1');
      expect(ids).toContain('ctx-2');
    });
  });
});

describe('getContext', () => {
  it('should return singleton instance', () => {
    const c1 = getContext();
    const c2 = getContext();
    expect(c1).toBe(c2);
  });
});
