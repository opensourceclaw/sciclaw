import { describe, it, expect } from 'vitest';
import { ExplanationGenerator } from '../../../src/reasoning/explainer/generator.js';
import { ConfidenceEvaluator } from '../../../src/reasoning/explainer/confidence.js';
import { DecompositionStrategy, StepStatus } from '../../../src/reasoning/chain_of_thought/types.js';
import type { ReasoningChain, ReasoningStepResult, DecomposedStep } from '../../../src/reasoning/chain_of_thought/types.js';
import type { ConfidenceFactors } from '../../../src/reasoning/explainer/types.js';

function makeStepResult(
  stepNumber: number,
  confidence: number,
  reasoning: string,
  status: StepStatus = StepStatus.COMPLETED,
): ReasoningStepResult {
  const step: DecomposedStep = {
    id: `step-${stepNumber}`,
    stepNumber,
    subQuestion: `Question ${stepNumber}`,
    dependencies: [],
    strategy: DecompositionStrategy.BALANCED,
    depth: 0,
    status,
  };
  return {
    step,
    reasoning,
    result: reasoning,
    confidence,
    sources: ['source-a'],
    durationMs: 100,
  };
}

function makeChain(steps: ReasoningStepResult[]): ReasoningChain {
  return {
    id: 'chain-1',
    originalQuestion: 'Test question',
    strategy: DecompositionStrategy.BALANCED,
    steps,
    finalResult: 'Final result',
    confidence: 0.7,
    createdAt: new Date(),
    completedAt: new Date(),
  };
}

describe('ExplanationGenerator', () => {
  const generator = new ExplanationGenerator();
  const evaluator = new ConfidenceEvaluator();

  it('should generate explanation with step structure', () => {
    const chain = makeChain([
      makeStepResult(0, 0.9, 'Root reasoning'),
      makeStepResult(1, 0.8, 'Step reasoning'),
    ]);
    const confidence = evaluator.evaluate([], 2, 0.5);
    const explanation = generator.generate(chain, confidence);
    expect(explanation.chainId).toBe('chain-1');
    expect(explanation.steps).toHaveLength(2);
    expect(explanation.summary).toBeDefined();
  });

  it('should generate summary with high confidence phrasing', () => {
    const chain = makeChain([
      makeStepResult(0, 0.9, 'Root'),
    ]);
    const confidence: ConfidenceFactors = {
      evidenceCount: 3,
      evidenceConsistency: 0.9,
      chainLength: 1,
      sourceAuthority: 0.8,
      temporalRecency: 0.7,
      overall: 0.85,
    };
    const explanation = generator.generate(chain, confidence);
    expect(explanation.summary).toContain('high confidence');
  });

  it('should generate summary with low confidence phrasing', () => {
    const chain = makeChain([
      makeStepResult(0, 0.2, 'Root'),
    ]);
    const confidence: ConfidenceFactors = {
      evidenceCount: 0,
      evidenceConsistency: 0,
      chainLength: 1,
      sourceAuthority: 0.5,
      temporalRecency: 0.5,
      overall: 0.15,
    };
    const explanation = generator.generate(chain, confidence);
    expect(explanation.summary).toContain('low confidence');
  });

  it('should include failed steps in summary', () => {
    const chain = makeChain([
      makeStepResult(0, 0.9, 'Root'),
      makeStepResult(1, 0, 'Failed', StepStatus.FAILED),
    ]);
    const confidence = evaluator.evaluate([], 2, 0.5);
    const explanation = generator.generate(chain, confidence);
    expect(explanation.summary).toContain('1 of 2');
  });

  it('should collect evidence items from steps', () => {
    const chain = makeChain([
      makeStepResult(0, 0.9, 'Root reasoning with details'),
    ]);
    const confidence = evaluator.evaluate([], 1, 0.5);
    const explanation = generator.generate(chain, confidence);
    expect(explanation.evidence.length).toBeGreaterThan(0);
    expect(explanation.evidence[0]!.source).toBe('source-a');
  });
});
