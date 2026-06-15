import { describe, it, expect } from 'vitest';
import { Visualizer } from '../../../src/reasoning/visualization/index.js';
import { DecompositionStrategy, StepStatus } from '../../../src/reasoning/chain_of_thought/types.js';
import type { ReasoningChain, ReasoningStepResult, DecomposedStep } from '../../../src/reasoning/chain_of_thought/types.js';

function makeChain(): ReasoningChain {
  const step: DecomposedStep = {
    id: 'step-0', stepNumber: 0, subQuestion: 'Test?',
    dependencies: [], strategy: DecompositionStrategy.BALANCED,
    depth: 0, status: StepStatus.COMPLETED,
  };
  const result: ReasoningStepResult = {
    step, reasoning: 'Test reasoning', result: 'Test result',
    confidence: 0.8, sources: [], durationMs: 100,
  };
  return {
    id: 'chain-1', originalQuestion: 'Test?',
    strategy: DecompositionStrategy.BALANCED, steps: [result],
    finalResult: 'Test result', confidence: 0.8,
    createdAt: new Date(),
  };
}

describe('Visualizer', () => {
  it('should build tree from chain', () => {
    const visualizer = new Visualizer();
    const chain = makeChain();
    const tree = visualizer.buildTree(chain);
    expect(tree.root.label).toBe('Test?');
    expect(tree.metadata.totalNodes).toBe(1);
  });

  it('should export to JSON', () => {
    const visualizer = new Visualizer();
    const chain = makeChain();
    const tree = visualizer.buildTree(chain);
    const json = visualizer.export(tree, { format: 'json', includeMetadata: true });
    const parsed = JSON.parse(json);
    expect(parsed.root.label).toBe('Test?');
  });

  it('should export to Markdown', () => {
    const visualizer = new Visualizer();
    const chain = makeChain();
    const tree = visualizer.buildTree(chain);
    const md = visualizer.export(tree, { format: 'markdown', includeMetadata: false });
    expect(md).toContain('Test?');
  });
});
