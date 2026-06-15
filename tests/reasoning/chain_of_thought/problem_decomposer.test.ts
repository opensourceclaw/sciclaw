import { describe, it, expect, vi } from 'vitest';
import { ProblemDecomposer } from '../../../src/reasoning/chain_of_thought/problem_decomposer.js';
import { DecompositionStrategy, StepStatus } from '../../../src/reasoning/chain_of_thought/types.js';
import type { LLMEngine } from '../../../src/summarization/types.js';

function createMockEngine(): LLMEngine {
  return {
    model: 'mock-model',
    chat: vi.fn().mockResolvedValue({ content: 'Mock response', model: 'mock-model' }),
    chatSimple: vi.fn().mockResolvedValue('Mock response'),
  };
}

describe('ProblemDecomposer', () => {
  const decomposer = new ProblemDecomposer();

  it('should decompose a causal question', () => {
    const steps = decomposer.decompose('Why does the sky appear blue?');
    expect(steps.length).toBeGreaterThan(1);
    expect(steps[0]!.subQuestion).toBe('Why does the sky appear blue?');
    expect(steps[0]!.status).toBe(StepStatus.PENDING);
  });

  it('should decompose a procedural question', () => {
    const steps = decomposer.decompose('How to bake a cake?');
    expect(steps.length).toBeGreaterThan(1);
    expect(steps.some((s) => s.subQuestion.includes('prerequisites'))).toBe(true);
  });

  it('should decompose a comparison question', () => {
    const steps = decomposer.decompose('Compare Python and JavaScript');
    expect(steps.length).toBeGreaterThan(1);
    expect(steps.some((s) => s.subQuestion.includes('similarities'))).toBe(true);
  });

  it('should decompose a multi-part question', () => {
    const steps = decomposer.decompose('What is AI? How does it work? What are its applications?');
    expect(steps.length).toBeGreaterThan(1);
  });

  it('should return single step for factual question', () => {
    const steps = decomposer.decompose('What is the capital of France?');
    expect(steps).toHaveLength(1);
  });

  it('should return empty array for empty question', () => {
    const steps = decomposer.decompose('');
    expect(steps).toHaveLength(0);
  });

  it('should respect maxSteps limit', () => {
    const limited = new ProblemDecomposer({ maxSteps: 2 });
    const steps = limited.decompose('Why is the sky blue? How does rain form? What causes wind?', DecompositionStrategy.BROAD);
    expect(steps.length).toBeLessThanOrEqual(2);
  });

  it('should generate different structures for different strategies', () => {
    const broad = decomposer.decompose('How does the economy work?', DecompositionStrategy.BROAD);
    const deep = decomposer.decompose('How does the economy work?', DecompositionStrategy.DEEP);
    expect(broad.length).toBeGreaterThanOrEqual(deep.length);
  });

  it('should set correct dependencies for sequential steps', () => {
    const steps = decomposer.decompose('How to learn programming?');
    const proceduralSteps = steps.filter((s) => s.stepNumber > 0);
    if (proceduralSteps.length > 1) {
      expect(proceduralSteps[1]!.dependencies.length).toBeGreaterThanOrEqual(2);
    }
  });
});
