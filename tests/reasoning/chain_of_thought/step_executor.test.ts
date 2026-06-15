import { describe, it, expect, vi } from 'vitest';
import { StepExecutor } from '../../../src/reasoning/chain_of_thought/step_executor.js';
import { DecompositionStrategy, StepStatus } from '../../../src/reasoning/chain_of_thought/types.js';
import type { DecomposedStep, ChainOfThoughtConfig } from '../../../src/reasoning/chain_of_thought/types.js';
import type { LLMEngine } from '../../../src/summarization/types.js';

function createMockEngine(response?: string): LLMEngine {
  return {
    model: 'mock-model',
    chat: vi.fn().mockResolvedValue({ content: response ?? 'Step result.', model: 'mock-model' }),
    chatSimple: vi.fn().mockResolvedValue(response ?? 'Step result.'),
  };
}

function makeStep(id: string, num: number, question: string, deps: string[] = [], depth = 0): DecomposedStep {
  return {
    id,
    stepNumber: num,
    subQuestion: question,
    dependencies: deps,
    strategy: DecompositionStrategy.BALANCED,
    depth,
    status: StepStatus.PENDING,
  };
}

describe('StepExecutor', () => {
  it('should execute steps in order', async () => {
    const engine = createMockEngine();
    const executor = new StepExecutor(engine);
    const steps = [
      makeStep('s1', 0, 'Root question'),
      makeStep('s2', 1, 'Sub step 1', ['s1']),
    ];
    const results = await executor.execute(steps);
    expect(results).toHaveLength(2);
    expect(results[0]!.step.status).toBe(StepStatus.COMPLETED);
  });

  it('should execute independent steps in parallel', async () => {
    const engine = createMockEngine();
    const executor = new StepExecutor(engine);
    const steps = [
      makeStep('s1', 0, 'Root'),
      makeStep('s2', 1, 'Branch A', ['s1']),
      makeStep('s3', 2, 'Branch B', ['s1']),
    ];
    const results = await executor.execute(steps);
    expect(results).toHaveLength(3);
    expect(results.filter((r) => r.step.status === StepStatus.COMPLETED)).toHaveLength(3);
  });

  it('should handle empty steps', async () => {
    const engine = createMockEngine();
    const executor = new StepExecutor(engine);
    const results = await executor.execute([]);
    expect(results).toHaveLength(0);
  });

  it('should mark failed steps', async () => {
    const failingEngine: LLMEngine = {
      model: 'mock-model',
      chat: vi.fn().mockRejectedValue(new Error('LLM failed')),
      chatSimple: vi.fn().mockRejectedValue(new Error('LLM failed')),
    };
    const executor = new StepExecutor(failingEngine, { retryCount: 0 });
    const steps = [makeStep('s1', 0, 'Will fail')];
    const results = await executor.execute(steps);
    expect(results).toHaveLength(1);
    expect(results[0]!.step.status).toBe(StepStatus.FAILED);
    expect(results[0]!.error).toBeDefined();
  });

  it('should skip steps with failed dependencies', async () => {
    const failingEngine: LLMEngine = {
      model: 'mock-model',
      chat: vi.fn().mockRejectedValue(new Error('LLM failed')),
      chatSimple: vi.fn().mockRejectedValue(new Error('LLM failed')),
    };
    const executor = new StepExecutor(failingEngine, { retryCount: 0 });
    const steps = [
      makeStep('s1', 0, 'Root'),
      makeStep('s2', 1, 'Depends on root', ['s1']),
    ];
    const results = await executor.execute(steps);
    expect(results).toHaveLength(2);
    const failed = results.filter((r) => r.step.status === StepStatus.FAILED);
    expect(failed.length).toBeGreaterThanOrEqual(1);
  });

  it('should detect circular dependencies', async () => {
    const engine = createMockEngine();
    const executor = new StepExecutor(engine);
    const steps = [
      makeStep('s1', 0, 'Step A', ['s2']),
      makeStep('s2', 1, 'Step B', ['s1']),
    ];
    await expect(executor.execute(steps)).rejects.toThrow(/circular/i);
  });

  it('should cache repeated sub-questions', async () => {
    const chatSimple = vi.fn().mockImplementation(() => Promise.resolve('Step result.'));
    const engine: LLMEngine = {
      model: 'mock-model',
      chat: vi.fn().mockResolvedValue({ content: 'Step result.', model: 'mock-model' }),
      chatSimple,
    };
    const executor = new StepExecutor(engine);
    const steps = [
      makeStep('s1', 0, 'Same question'),
      makeStep('s2', 1, 'Same question', ['s1']),
    ];
    await executor.execute(steps);
    // Cache hit: only 1 unique LLM call for the same sub-question
    expect(chatSimple).toHaveBeenCalledTimes(1);
  });
});
