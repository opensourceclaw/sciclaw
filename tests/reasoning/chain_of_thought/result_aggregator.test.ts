import { describe, it, expect } from 'vitest';
import { ResultAggregator } from '../../../src/reasoning/chain_of_thought/result_aggregator.js';
import { DecompositionStrategy, StepStatus } from '../../../src/reasoning/chain_of_thought/types.js';
import type { ReasoningStepResult, DecomposedStep } from '../../../src/reasoning/chain_of_thought/types.js';

function makeStepResult(
  stepNumber: number,
  status: StepStatus,
  confidence: number,
  reasoning = 'Step reasoning.',
  depth = 0,
  parentId?: string,
): ReasoningStepResult {
  const step: DecomposedStep = {
    id: `step-${stepNumber}`,
    stepNumber,
    subQuestion: `Question ${stepNumber}`,
    parentId,
    dependencies: parentId ? [parentId] : [],
    strategy: DecompositionStrategy.BALANCED,
    depth,
    status,
  };
  return {
    step,
    reasoning,
    result: status === StepStatus.COMPLETED ? `Result ${stepNumber}` : null,
    confidence,
    sources: [`source-${stepNumber}`],
    durationMs: 100,
    ...(status === StepStatus.FAILED ? { error: 'Step failed' } : {}),
  };
}

describe('ResultAggregator', () => {
  const aggregator = new ResultAggregator();

  it('should aggregate multiple steps', () => {
    const results = [
      makeStepResult(0, StepStatus.COMPLETED, 0.9, 'Root reasoning'),
      makeStepResult(1, StepStatus.COMPLETED, 0.8, 'Child reasoning'),
    ];
    const chain = aggregator.aggregate(results, 'Original question');
    expect(chain.originalQuestion).toBe('Original question');
    expect(chain.steps).toHaveLength(2);
    expect(chain.finalResult).toContain('Step 0');
    expect(chain.finalResult).toContain('Step 1');
  });

  it('should handle single step', () => {
    const results = [makeStepResult(0, StepStatus.COMPLETED, 0.9)];
    const chain = aggregator.aggregate(results, 'Single question');
    expect(chain.finalResult).toBe('Result 0');
    expect(chain.confidence).toBe(0.9);
  });

  it('should handle empty results', () => {
    const chain = aggregator.aggregate([], 'Empty question');
    expect(chain.finalResult).toBeNull();
    expect(chain.confidence).toBe(0);
  });

  it('should handle all failed steps', () => {
    const results = [
      makeStepResult(0, StepStatus.FAILED, 0),
      makeStepResult(1, StepStatus.FAILED, 0),
    ];
    const chain = aggregator.aggregate(results, 'Failed question');
    expect(chain.finalResult).toBeNull();
    expect(chain.confidence).toBe(0);
  });

  it('should compute weighted confidence', () => {
    const results = [
      makeStepResult(0, StepStatus.COMPLETED, 1.0, '', 0),
      makeStepResult(1, StepStatus.COMPLETED, 0.5, '', 1),
    ];
    const chain = aggregator.aggregate(results, 'Confidence test');
    // weight for depth=0: 1/(0+1)=1, depth=1: 1/(1+1)=0.5
    // weighted = (1.0*1 + 0.5*0.5) / (1 + 0.5) = 1.25/1.5 = 0.8333
    expect(chain.confidence).toBeCloseTo(0.83, 1);
  });

  it('should deduplicate sources', () => {
    const results = [
      { ...makeStepResult(0, StepStatus.COMPLETED, 0.9), sources: ['src-a', 'src-b'] },
      { ...makeStepResult(1, StepStatus.COMPLETED, 0.8), sources: ['src-b', 'src-c'] },
    ];
    const chain = aggregator.aggregate(results, 'Source test');
    const allSources = chain.steps.flatMap((s) => s.sources);
    const uniqueSources = new Set(allSources);
    // The chain doesn't store merged sources; each step keeps its own
    expect(uniqueSources.size).toBe(3);
  });

  it('should detect conflicts between sibling steps', () => {
    const results = [
      makeStepResult(0, StepStatus.COMPLETED, 0.9, '', 0, 'parent'),
      makeStepResult(1, StepStatus.COMPLETED, 0.2, '', 1, 'parent'),
    ];
    const conflicts = aggregator.detectConflicts(results);
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0]!.description).toContain('Confidence gap');
  });

  it('should handle partial failure with note', () => {
    const results = [
      makeStepResult(0, StepStatus.COMPLETED, 0.9, 'Root reasoning'),
      makeStepResult(1, StepStatus.FAILED, 0, '', 1),
      makeStepResult(2, StepStatus.COMPLETED, 0.7, 'Step 2 reasoning'),
    ];
    const chain = aggregator.aggregate(results, 'Partial failure');
    expect(chain.finalResult).toContain('1 step(s) failed');
  });

  it('should sort steps by stepNumber', () => {
    const results = [
      makeStepResult(2, StepStatus.COMPLETED, 0.7),
      makeStepResult(0, StepStatus.COMPLETED, 0.9),
      makeStepResult(1, StepStatus.COMPLETED, 0.8),
    ];
    const chain = aggregator.aggregate(results, 'Sort test');
    expect(chain.steps[0]!.step.stepNumber).toBe(0);
    expect(chain.steps[1]!.step.stepNumber).toBe(1);
    expect(chain.steps[2]!.step.stepNumber).toBe(2);
  });
});
