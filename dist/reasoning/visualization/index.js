/**
 * Visualization - Facade for reasoning visualization
 */
import { TreeGenerator } from './tree_generator.js';
import { Formatter } from './formatter.js';
export { TreeGenerator } from './tree_generator.js';
export { Formatter } from './formatter.js';
export class Visualizer {
    treeGenerator;
    formatter;
    constructor() {
        this.treeGenerator = new TreeGenerator();
        this.formatter = new Formatter();
    }
    buildTree(chain, maxDepth) {
        return this.treeGenerator.generate(chain, maxDepth);
    }
    export(tree, options) {
        return this.formatter.format(tree, options);
    }
}
//# sourceMappingURL=index.js.map