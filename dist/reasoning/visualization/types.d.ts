/**
 * Visualization types - Reasoning tree and export formats
 */
import type { StepStatus } from '../chain_of_thought/types.js';
export interface TreeNode {
    id: string;
    label: string;
    description: string;
    confidence: number;
    status: StepStatus;
    children: TreeNode[];
    metadata: Record<string, unknown>;
}
export interface VisualizationTree {
    root: TreeNode;
    metadata: {
        totalNodes: number;
        maxDepth: number;
        createdAt: Date;
    };
}
export interface ExportOptions {
    format: 'json' | 'markdown';
    includeMetadata: boolean;
    maxDepth?: number;
}
//# sourceMappingURL=types.d.ts.map