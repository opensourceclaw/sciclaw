import { describe, it, expect } from 'vitest';
import { Explainer } from '../../../src/reasoning/explainer/index.js';
import { DecompositionStrategy, StepStatus } from '../../../src/reasoning/chain_of_thought/types.js';
import type { ReasoningChain, ReasoningStepResult, DecomposedStep } from '../../../src/reasoning/chain_of_thought/types.js';

function makeChain(): ReasoningChain {
  const step: DecomposedStep = {
    id: 'step-0',
    stepNumber: 0,
    subQuestion: 'Test?',
    dependencies: [],
    strategy: DecompositionStrategy.BALANCED,
    depth: 0,
    status: StepStatus.COMPLETED,
  };
  const result: ReasoningStepResult = {
    step,
    reasoning: 'Test reasoning',
    result: 'Test result',
    confidence: 0.8,
    sources: ['src-a'],
    durationMs: 100,
  };
  return {
    id: 'chain-1',
    originalQuestion: 'Test?',
    strategy: DecompositionStrategy.BALANCED,
    steps: [result],
    finalResult: 'Test result',
    confidence: 0.8,
    createdAt: new Date(),
    completedAt: new Date(),
  };
}

describe('Explainer', () => {
  it('should generate explanation from chain', () => {
    const explainer = new Explainer();
    const chain = makeChain();
    const explanation = explainer.generateExplanation(chain);
    expect(explanation.chainId).toBe('chain-1');
    expect(explanation.steps).toHaveLength(1);
    expect(explanation.generatedAt).toBeInstanceOf(Date);
  });

  it('should evaluate confidence', () => {
    const explainer = new Explainer();
    const factors = explainer.evaluateConfidence([], 1, 0.5);
    expect(factors.overall).toBeDefined();
    expect(factors.evidenceCount).toBe(0);
  });

  it('should manage logs', () => {
    const explainer = new Explainer();
    explainer.logger.info(0, 'test', '', '', '', 0, 0);
    expect(explainer.getLogs()).toHaveLength(1);
    explainer.clearLogs();
    expect(explainer.getLogs()).toHaveLength(0);
  });
});
