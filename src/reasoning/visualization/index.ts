/**
 * Visualization - Facade for reasoning visualization
 */

import { TreeGenerator } from './tree_generator.js';
import { Formatter } from './formatter.js';
import type { TreeNode, VisualizationTree, ExportOptions } from './types.js';
import type { ReasoningChain } from '../chain_of_thought/types.js';

export { TreeGenerator } from './tree_generator.js';
export { Formatter } from './formatter.js';
export type {
  TreeNode,
  VisualizationTree,
  ExportOptions,
} from './types.js';

export class Visualizer {
  private treeGenerator: TreeGenerator;
  private formatter: Formatter;

  constructor() {
    this.treeGenerator = new TreeGenerator();
    this.formatter = new Formatter();
  }

  buildTree(chain: ReasoningChain, maxDepth?: number): VisualizationTree {
    return this.treeGenerator.generate(chain, maxDepth);
  }

  export(tree: VisualizationTree, options: ExportOptions): string {
    return this.formatter.format(tree, options);
  }
}
