import { describe, it, expect, vi } from 'vitest';
import { ReasoningEngine } from '../../src/reasoning/index.js';
import { DecompositionStrategy } from '../../src/reasoning/chain_of_thought/types.js';
import type { LLMEngine } from '../../src/summarization/types.js';

function createMockEngine(): LLMEngine {
  return {
    model: 'mock-model',
    chat: vi.fn().mockResolvedValue({ content: 'Mock response', model: 'mock-model' }),
    chatSimple: vi.fn().mockResolvedValue('Mock response'),
  };
}

describe('ReasoningEngine', () => {
  it('should run full reasoning pipeline', async () => {
    const engine = createMockEngine();
    const re = new ReasoningEngine(engine);
    const result = await re.run('What is gravity?');
    expect(result.chain).toBeDefined();
    expect(result.explanation).toBeDefined();
    expect(result.metrics.totalSteps).toBeGreaterThan(0);
  });

  it('should decompose a question', async () => {
    const engine = createMockEngine();
    const re = new ReasoningEngine(engine);
    const steps = await re.decompose('How does rain form?');
    expect(steps.length).toBeGreaterThan(0);
  });

  it('should analyze causal text', async () => {
    const engine = createMockEngine();
    const re = new ReasoningEngine(engine);
    const graph = await re.analyzeCausal('Smoking causes cancer.');
    expect(graph.variables.length).toBeGreaterThan(0);
  });

  it('should accept config options', () => {
    const engine = createMockEngine();
    const re = new ReasoningEngine(engine, { maxDepth: 3, maxSteps: 10 });
    expect(re).toBeInstanceOf(ReasoningEngine);
  });

  it('should expose sub-modules', () => {
    expect(DecompositionStrategy).toBeDefined();
  });
});
