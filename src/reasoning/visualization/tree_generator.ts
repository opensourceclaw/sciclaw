/**
 * Tree Generator - Converts reasoning chains to tree structures
 */

import type { TreeNode, VisualizationTree } from './types.js';
import type { ReasoningChain, ReasoningStepResult } from '../chain_of_thought/types.js';
import { StepStatus } from '../chain_of_thought/types.js';

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export class TreeGenerator {
  generate(chain: ReasoningChain, maxDepth?: number): VisualizationTree {
    const root = this.buildRoot(chain);

    // Build parent → children map
    const childrenMap = new Map<string, ReasoningStepResult[]>();
    for (const stepResult of chain.steps) {
      const parentId = stepResult.step.parentId;
      if (!parentId) continue; // Skip root step
      if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
      childrenMap.get(parentId)!.push(stepResult);
    }

    // Recursively build tree
    this.buildChildren(root, chain.steps, childrenMap, 0, maxDepth ?? Infinity);

    const depth = this.calculateDepth(root, 0);

    return {
      root,
      metadata: {
        totalNodes: this.countNodes(root),
        maxDepth: depth,
        createdAt: new Date(),
      },
    };
  }

  private buildRoot(chain: ReasoningChain): TreeNode {
    const rootStep = chain.steps[0];
    return {
      id: rootStep?.step.id ?? chain.id,
      label: chain.originalQuestion,
      description: typeof chain.finalResult === 'string'
        ? chain.finalResult.slice(0, 200)
        : JSON.stringify(chain.finalResult).slice(0, 200),
      confidence: chain.confidence,
      status: StepStatus.COMPLETED,
      children: [],
      metadata: {
        strategy: chain.strategy,
        totalSteps: chain.steps.length,
      },
    };
  }

  private buildChildren(
    parentNode: TreeNode,
    allSteps: ReasoningStepResult[],
    childrenMap: Map<string, ReasoningStepResult[]>,
    currentDepth: number,
    maxDepth: number,
  ): void {
    if (currentDepth >= maxDepth) return;

    const stepResults = childrenMap.get(parentNode.id) ?? [];
    for (const stepResult of stepResults) {
      const node = this.stepToNode(stepResult, currentDepth + 1);
      parentNode.children.push(node);

      // Recursively build grandchildren
      this.buildChildren(node, allSteps, childrenMap, currentDepth + 1, maxDepth);
    }
  }

  private stepToNode(stepResult: ReasoningStepResult, depth: number): TreeNode {
    return {
      id: stepResult.step.id,
      label: stepResult.step.subQuestion,
      description: typeof stepResult.result === 'string'
        ? stepResult.result.slice(0, 200)
        : JSON.stringify(stepResult.result).slice(0, 200),
      confidence: stepResult.confidence,
      status: stepResult.step.status,
      children: [],
      metadata: {
        stepNumber: stepResult.step.stepNumber,
        depth,
        durationMs: stepResult.durationMs,
        error: stepResult.error,
      },
    };
  }

  private countNodes(node: TreeNode): number {
    let count = 1;
    for (const child of node.children) {
      count += this.countNodes(child);
    }
    return count;
  }

  private calculateDepth(node: TreeNode, currentDepth: number): number {
    if (node.children.length === 0) return currentDepth;
    let maxChildDepth = 0;
    for (const child of node.children) {
      maxChildDepth = Math.max(maxChildDepth, this.calculateDepth(child, currentDepth + 1));
    }
    return maxChildDepth;
  }
}
