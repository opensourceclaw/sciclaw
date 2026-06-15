import { describe, it, expect } from 'vitest';
import { DeepClawPluginHooks, registerHooks } from '../../src/plugin/index.js';

describe('DeepClawPluginHooks', () => {
  it('should load', () => {
    const hooks = new DeepClawPluginHooks();
    const result = hooks.onLoad();
    expect(result.status).toBe('loaded');
  });

  it('should unload', () => {
    const hooks = new DeepClawPluginHooks();
    hooks.onSessionStart({ scenario: 'research' });
    const result = hooks.onUnload();
    expect(result.status).toBe('unloaded');
  });

  it('should handle session start', () => {
    const hooks = new DeepClawPluginHooks();
    const ctx = hooks.onSessionStart({ scenario: 'research', topic: 'AI' });
    expect(ctx).toContain('DeepClaw session started');
    expect(ctx).toContain('research');
  });

  it('should handle session end', () => {
    const hooks = new DeepClawPluginHooks();
    const result = hooks.onSessionEnd({});
    expect(result.status).toBe('ok');
  });

  it('should handle feedback', () => {
    const hooks = new DeepClawPluginHooks();
    const result = hooks.onFeedback({ feedback: 'Good work' });
    expect(result.status).toBe('ok');
  });

  it('should skip empty feedback', () => {
    const hooks = new DeepClawPluginHooks();
    const result = hooks.onFeedback({});
    expect(result.status).toBe('skipped');
  });

  it('should get status', () => {
    const hooks = new DeepClawPluginHooks();
    const status = hooks.getStatus();
    expect(status.initialized).toBe(false);
    hooks.onSessionStart({});
    const status2 = hooks.getStatus();
    expect(status2.initialized).toBe(true);
  });
});

describe('registerHooks', () => {
  it('should create plugin hooks', () => {
    const hooks = registerHooks();
    expect(hooks).toBeInstanceOf(DeepClawPluginHooks);
  });
});
