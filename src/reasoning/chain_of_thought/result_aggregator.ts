/**
 * Result Aggregator - Combines step results into a final ReasoningChain
 */

import {
  ReasoningStepResult,
  ReasoningChain,
  DecompositionStrategy,
  StepStatus,
} from './types.js';

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export class ResultAggregator {
  aggregate(
    results: ReasoningStepResult[],
    originalQuestion: string,
    strategy: DecompositionStrategy = DecompositionStrategy.BALANCED,
  ): ReasoningChain {
    const now = new Date();

    if (results.length === 0) {
      return {
        id: generateId(),
        originalQuestion,
        strategy,
        steps: [],
        finalResult: null,
        confidence: 0,
        createdAt: now,
      };
    }

    // Sort by stepNumber
    const sorted = [...results].sort((a, b) => a.step.stepNumber - b.step.stepNumber);

    // Merge all sources (dedup)
    const allSources = Array.from(new Set(sorted.flatMap((r) => r.sources)));

    // Compute confidence (weighted by depth)
    const totalWeight = sorted.reduce((sum, r) => {
      if (r.step.status === StepStatus.COMPLETED) {
        return sum + 1 / (r.step.depth + 1);
      }
      return sum;
    }, 0);

    const weightedConfidence = sorted.reduce((sum, r) => {
      if (r.step.status === StepStatus.COMPLETED) {
        return sum + r.confidence * (1 / (r.step.depth + 1));
      }
      return sum;
    }, 0);

    const confidence = totalWeight > 0 ? weightedConfidence / totalWeight : 0;

    // Build final result text
    const successfulSteps = sorted.filter(
      (r) => r.step.status === StepStatus.COMPLETED,
    );
    const failedSteps = sorted.filter(
      (r) => r.step.status === StepStatus.FAILED,
    );

    let finalResult: unknown;
    if (successfulSteps.length === 0) {
      finalResult = null;
    } else if (successfulSteps.length === 1) {
      finalResult = successfulSteps[0]!.result;
    } else {
      const parts = successfulSteps.map(
        (r) => `Step ${r.step.stepNumber}: ${r.reasoning}`,
      );
      if (failedSteps.length > 0) {
        parts.push(`(Note: ${failedSteps.length} step(s) failed)`);
      }
      finalResult = parts.join('\n\n');
    }

    const completedSteps = sorted.filter(
      (r) => r.step.status !== StepStatus.PENDING && r.step.status !== StepStatus.SKIPPED,
    );

    return {
      id: generateId(),
      originalQuestion,
      strategy,
      steps: sorted,
      finalResult,
      confidence: Math.round(confidence * 100) / 100,
      createdAt: now,
      completedAt: now,
    };
  }

  detectConflicts(results: ReasoningStepResult[]): Array<{
    stepA: number;
    stepB: number;
    description: string;
  }> {
    const conflicts: Array<{ stepA: number; stepB: number; description: string }> = [];

    // Check for conflicting results from sibling steps (same parent)
    const byParent = new Map<string, ReasoningStepResult[]>();
    for (const r of results) {
      const parentId = r.step.parentId ?? 'root';
      if (!byParent.has(parentId)) byParent.set(parentId, []);
      byParent.get(parentId)!.push(r);
    }

    for (const [, group] of byParent) {
      if (group.length < 2) continue;
      // Simple heuristic: if confidence differs by > 0.5, flag as conflict
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const diff = Math.abs(group[i]!.confidence - group[j]!.confidence);
          if (diff > 0.5) {
            conflicts.push({
              stepA: group[i]!.step.stepNumber,
              stepB: group[j]!.step.stepNumber,
              description: `Confidence gap (${diff.toFixed(2)}) between sibling steps`,
            });
          }
        }
      }
    }

    return conflicts;
  }
}
