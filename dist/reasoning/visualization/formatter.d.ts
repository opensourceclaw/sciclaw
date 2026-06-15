/**
 * Formatter - Exports visualization trees as JSON or Markdown
 */
import type { VisualizationTree, ExportOptions } from './types.js';
export declare class Formatter {
    format(tree: VisualizationTree, options: ExportOptions): string;
    private toJSON;
    private toMarkdown;
    private renderNode;
    private getStatusIcon;
    private stripMetadata;
}
//# sourceMappingURL=formatter.d.ts.map