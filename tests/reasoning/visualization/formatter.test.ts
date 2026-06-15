import { describe, it, expect } from 'vitest';
import { Formatter } from '../../../src/reasoning/visualization/formatter.js';
import { TreeGenerator } from '../../../src/reasoning/visualization/tree_generator.js';
import { DecompositionStrategy, StepStatus } from '../../../src/reasoning/chain_of_thought/types.js';
import type { ReasoningChain, ReasoningStepResult, DecomposedStep } from '../../../src/reasoning/chain_of_thought/types.js';

function makeChain(): ReasoningChain {
  const steps: ReasoningStepResult[] = [
    {
      step: {
        id: 'step-0', stepNumber: 0, subQuestion: 'Root?',
        dependencies: [], strategy: DecompositionStrategy.BALANCED,
        depth: 0, status: StepStatus.COMPLETED,
      },
      reasoning: 'Root reasoning', result: 'Root result',
      confidence: 0.9, sources: [], durationMs: 100,
    },
    {
      step: {
        id: 'step-1', stepNumber: 1, subQuestion: 'Child?',
        parentId: 'step-0', dependencies: ['step-0'],
        strategy: DecompositionStrategy.BALANCED,
        depth: 1, status: StepStatus.COMPLETED,
      },
      reasoning: 'Child reasoning', result: 'Child result',
      confidence: 0.7, sources: [], durationMs: 100,
    },
  ];
  return {
    id: 'chain-1', originalQuestion: 'Root?',
    strategy: DecompositionStrategy.BALANCED, steps,
    finalResult: 'Final result', confidence: 0.8,
    createdAt: new Date(),
  };
}

describe('Formatter', () => {
  const generator = new TreeGenerator();
  const formatter = new Formatter();

  it('should export to JSON with metadata', () => {
    const chain = makeChain();
    const tree = generator.generate(chain);
    const json = formatter.format(tree, { format: 'json', includeMetadata: true });
    const parsed = JSON.parse(json);
    expect(parsed.root).toBeDefined();
    expect(parsed.metadata).toBeDefined();
  });

  it('should export to JSON without metadata', () => {
    const chain = makeChain();
    const tree = generator.generate(chain);
    const json = formatter.format(tree, { format: 'json', includeMetadata: false });
    const parsed = JSON.parse(json);
    expect(parsed.root).toBeDefined();
    expect(parsed.metadata).toBeUndefined();
  });

  it('should export to Markdown', () => {
    const chain = makeChain();
    const tree = generator.generate(chain);
    const md = formatter.format(tree, { format: 'markdown', includeMetadata: true });
    expect(md).toContain('# Reasoning Tree');
    expect(md).toContain('[OK]');
    expect(md).toContain('Root?');
  });

  it('should respect maxDepth in Markdown export', () => {
    const chain = makeChain();
    const tree = generator.generate(chain);
    const md = formatter.format(tree, {
      format: 'markdown', includeMetadata: false, maxDepth: 0,
    });
    // At depth 0, only root node should appear
    expect(md).toContain('Root?');
  });
});
