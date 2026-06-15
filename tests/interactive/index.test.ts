import { describe, it, expect } from 'vitest';
import { InteractiveEngine } from '../../src/interactive/index.js';

describe('InteractiveEngine', () => {
  it('should run interactive research', async () => {
    const engine = new InteractiveEngine();
    const result = await engine.run('Research on AI');
    expect(result.sections.length).toBeGreaterThan(0);
    expect(result.progress).toBeDefined();
    expect(result.totalDurationMs).toBeGreaterThan(0);
  });

  it('should collect and process feedback', async () => {
    const engine = new InteractiveEngine();
    const fb = engine.collectFeedback('positive', 'Great direction');
    const processed = await engine.processFeedback(fb);
    expect(processed.action).toBe('continue');
  });

  it('should optimize queries', async () => {
    const engine = new InteractiveEngine();
    const queries = await engine.optimizeQueries(['AI performance']);
    expect(queries.length).toBeGreaterThan(0);
  });

  it('should get preview', async () => {
    const engine = new InteractiveEngine();
    const preview = engine.getPreview();
    expect(preview.totalSections).toBe(0);
  });

  it('should get progress', () => {
    const engine = new InteractiveEngine();
    const progress = engine.getProgress();
    expect(progress.status).toBe('idle');
  });

  it('should accept config', () => {
    const engine = new InteractiveEngine({
      feedback: { enabled: false, timeoutMs: 1000, maxHistory: 10 },
    });
    expect(engine).toBeInstanceOf(InteractiveEngine);
  });
});
