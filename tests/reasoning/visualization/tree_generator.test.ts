import { describe, it, expect } from 'vitest';
import { TreeGenerator } from '../../../src/reasoning/visualization/tree_generator.js';
import { DecompositionStrategy, StepStatus } from '../../../src/reasoning/chain_of_thought/types.js';
import type { ReasoningChain, ReasoningStepResult, DecomposedStep } from '../../../src/reasoning/chain_of_thought/types.js';

function makeStepResult(
  stepNumber: number,
  subQuestion: string,
  parentId?: string,
  status: StepStatus = StepStatus.COMPLETED,
): ReasoningStepResult {
  const step: DecomposedStep = {
    id: `step-${stepNumber}`,
    stepNumber,
    subQuestion,
    parentId,
    dependencies: parentId ? [parentId] : [],
    strategy: DecompositionStrategy.BALANCED,
    depth: parentId ? 1 : 0,
    status,
  };
  return {
    step,
    reasoning: `Reasoning for ${subQuestion}`,
    result: `Result for ${subQuestion}`,
    confidence: status === StepStatus.COMPLETED ? 0.8 : 0,
    sources: [],
    durationMs: 100,
    ...(status === StepStatus.FAILED ? { error: 'Failed' } : {}),
  };
}

function makeChain(steps: ReasoningStepResult[]): ReasoningChain {
  return {
    id: 'chain-1',
    originalQuestion: 'Root question',
    strategy: DecompositionStrategy.BALANCED,
    steps,
    finalResult: 'Final result',
    confidence: 0.8,
    createdAt: new Date(),
  };
}

describe('TreeGenerator', () => {
  const generator = new TreeGenerator();

  it('should build a tree from a reasoning chain', () => {
    const chain = makeChain([
      makeStepResult(0, 'Root question'),
      makeStepResult(1, 'Child question', 'step-0'),
    ]);
    const tree = generator.generate(chain);
    expect(tree.root.label).toBe('Root question');
    expect(tree.root.children).toHaveLength(1);
    expect(tree.root.children[0]!.label).toBe('Child question');
  });

  it('should handle chain with no steps', () => {
    const chain = makeChain([]);
    const tree = generator.generate(chain);
    expect(tree.root).toBeDefined();
    expect(tree.metadata.totalNodes).toBe(1);
  });

  it('should handle chain with single step', () => {
    const chain = makeChain([makeStepResult(0, 'Single question')]);
    const tree = generator.generate(chain);
    expect(tree.root.children).toHaveLength(0);
  });

  it('should mark failed nodes', () => {
    const chain = makeChain([
      makeStepResult(0, 'Root'),
      makeStepResult(1, 'Failed step', 'step-0', StepStatus.FAILED),
    ]);
    const tree = generator.generate(chain);
    expect(tree.root.children[0]!.status).toBe(StepStatus.FAILED);
  });

  it('should respect maxDepth parameter', () => {
    const chain = makeChain([
      makeStepResult(0, 'Root'),
      makeStepResult(1, 'Child', 'step-0'),
      makeStepResult(2, 'Grandchild', 'step-1'),
    ]);
    const tree = generator.generate(chain, 1);
    // Max depth 1 means only root + direct children
    expect(tree.metadata.maxDepth).toBeLessThanOrEqual(2);
  });

  it('should include metadata in tree', () => {
    const chain = makeChain([makeStepResult(0, 'Test')]);
    const tree = generator.generate(chain);
    expect(tree.metadata.totalNodes).toBeGreaterThan(0);
    expect(tree.metadata.createdAt).toBeInstanceOf(Date);
  });
});
