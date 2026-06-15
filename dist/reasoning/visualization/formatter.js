/**
 * Formatter - Exports visualization trees as JSON or Markdown
 */
export class Formatter {
    format(tree, options) {
        switch (options.format) {
            case 'json':
                return this.toJSON(tree, options);
            case 'markdown':
                return this.toMarkdown(tree, options);
            default:
                return this.toJSON(tree, options);
        }
    }
    toJSON(tree, options) {
        const data = options.includeMetadata
            ? tree
            : { root: this.stripMetadata(tree.root) };
        return JSON.stringify(data, null, 2);
    }
    toMarkdown(tree, options) {
        const lines = [];
        const maxDepth = options.maxDepth ?? Infinity;
        lines.push(`# Reasoning Tree: ${tree.root.label}`);
        lines.push('');
        lines.push(`- Confidence: ${Math.round(tree.root.confidence * 100)}%`);
        lines.push(`- Total Nodes: ${tree.metadata.totalNodes}`);
        lines.push(`- Max Depth: ${tree.metadata.maxDepth}`);
        if (options.includeMetadata) {
            lines.push(`- Created: ${tree.metadata.createdAt.toISOString()}`);
        }
        lines.push('');
        this.renderNode(tree.root, 0, maxDepth, lines);
        return lines.join('\n');
    }
    renderNode(node, depth, maxDepth, lines) {
        if (depth > maxDepth)
            return;
        const indent = '  '.repeat(depth);
        const statusIcon = this.getStatusIcon(node.status);
        const confidenceLabel = `${Math.round(node.confidence * 100)}%`;
        const line = `${indent}- ${statusIcon} **${node.label}** (confidence: ${confidenceLabel})`;
        lines.push(line);
        if (node.description) {
            lines.push(`${indent}  - ${node.description.slice(0, 150)}`);
        }
        for (const child of node.children) {
            this.renderNode(child, depth + 1, maxDepth, lines);
        }
    }
    getStatusIcon(status) {
        switch (status) {
            case 'completed': return '[OK]';
            case 'failed': return '[FAIL]';
            case 'running': return '[...]';
            case 'skipped': return '[SKIP]';
            default: return '[--]';
        }
    }
    stripMetadata(node) {
        return {
            ...node,
            metadata: {},
            children: node.children.map((c) => this.stripMetadata(c)),
        };
    }
}
//# sourceMappingURL=formatter.js.map