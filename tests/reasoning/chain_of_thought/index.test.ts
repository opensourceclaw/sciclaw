import { describe, it, expect, vi } from 'vitest';
import { ChainOfThought } from '../../../src/reasoning/chain_of_thought/index.js';
import { DecompositionStrategy } from '../../../src/reasoning/chain_of_thought/types.js';
import type { LLMEngine } from '../../../src/summarization/types.js';

function createMockEngine(): LLMEngine {
  return {
    model: 'mock-model',
    chat: vi.fn().mockResolvedValue({ content: 'Mock response', model: 'mock-model' }),
    chatSimple: vi.fn().mockResolvedValue('Mock response'),
  };
}

describe('ChainOfThought', () => {
  it('should decompose a question', async () => {
    const engine = createMockEngine();
    const cot = new ChainOfThought(engine);
    const steps = await cot.decompose('Why does rain fall?');
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0]!.subQuestion).toBe('Why does rain fall?');
  });

  it('should execute steps and return a ReasoningChain', async () => {
    const engine = createMockEngine();
    const cot = new ChainOfThought(engine);
    const steps = await cot.decompose('What is gravity?');
    const chain = await cot.execute(steps);
    expect(chain.originalQuestion).toBe('What is gravity?');
    expect(chain.finalResult).toBeDefined();
    expect(chain.confidence).toBeGreaterThan(0);
  });

  it('should aggregate results', async () => {
    const engine = createMockEngine();
    const cot = new ChainOfThought(engine);
    const steps = await cot.decompose('How do birds fly?');
    const chain = await cot.execute(steps);
    const result = await cot.aggregate(chain.steps);
    expect(result).toBeDefined();
  });

  it('should accept config options', () => {
    const engine = createMockEngine();
    const cot = new ChainOfThought(engine, { maxDepth: 3, maxSteps: 10 });
    expect(cot).toBeInstanceOf(ChainOfThought);
  });

  it('should export types and sub-modules', () => {
    expect(DecompositionStrategy).toBeDefined();
    expect(ChainOfThought).toBeDefined();
  });
});
