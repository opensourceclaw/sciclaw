/**
 * Visualization - Facade for reasoning visualization
 */
import type { VisualizationTree, ExportOptions } from './types.js';
import type { ReasoningChain } from '../chain_of_thought/types.js';
export { TreeGenerator } from './tree_generator.js';
export { Formatter } from './formatter.js';
export type { TreeNode, VisualizationTree, ExportOptions, } from './types.js';
export declare class Visualizer {
    private treeGenerator;
    private formatter;
    constructor();
    buildTree(chain: ReasoningChain, maxDepth?: number): VisualizationTree;
    export(tree: VisualizationTree, options: ExportOptions): string;
}
//# sourceMappingURL=index.d.ts.map