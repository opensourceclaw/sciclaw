import { describe, it, expect } from 'vitest';
import { ResearchSessionStartHook } from '../../src/integrations/session-start.js';

describe('ResearchSessionStartHook', () => {
  it('should run research scenario', () => {
    const hook = new ResearchSessionStartHook();
    const ctx = hook.run('research', { topic: 'AI' });
    expect(ctx).toContain('Related Memories');
  });

  it('should run search scenario', () => {
    const hook = new ResearchSessionStartHook();
    const ctx = hook.run('search');
    expect(ctx).toBe('');
  });

  it('should get status', () => {
    const hook = new ResearchSessionStartHook('/tmp');
    const status = hook.getStatus();
    expect(status.workspace).toBe('/tmp');
  });

  it('should get injection path', () => {
    const hook = new ResearchSessionStartHook('/workspace');
    const path = hook.getSessionInjectionPath();
    expect(path).toBe('/workspace/data/deepclaw/injections');
  });
});
