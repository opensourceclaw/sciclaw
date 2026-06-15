/**
 * Tree Generator - Converts reasoning chains to tree structures
 */
import type { VisualizationTree } from './types.js';
import type { ReasoningChain } from '../chain_of_thought/types.js';
export declare class TreeGenerator {
    generate(chain: ReasoningChain, maxDepth?: number): VisualizationTree;
    private buildRoot;
    private buildChildren;
    private stepToNode;
    private countNodes;
    private calculateDepth;
}
//# sourceMappingURL=tree_generator.d.ts.map