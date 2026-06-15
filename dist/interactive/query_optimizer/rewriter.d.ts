/**
 * Query Rewriter - Rewrites queries based on user feedback
 */
import type { RewriteRule } from './types.js';
import type { ProcessedFeedback } from '../feedback/types.js';
export declare class QueryRewriter {
    private rules;
    constructor();
    rewrite(query: string, feedback: ProcessedFeedback): string[];
    rewriteBatch(queries: string[], feedbacks: ProcessedFeedback[]): string[];
    addRule(rule: RewriteRule): void;
    getDefaultRules(): RewriteRule[];
}
//# sourceMappingURL=rewriter.d.ts.map