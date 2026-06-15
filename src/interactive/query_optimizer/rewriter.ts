/**
 * Query Rewriter - Rewrites queries based on user feedback
 */

import type { RewriteRule } from './types.js';
import type { ProcessedFeedback } from '../feedback/types.js';

const DEFAULT_RULES: RewriteRule[] = [
  { pattern: /too (broad|vague|general)/i, replacement: 'more specific', description: 'Broad → specific' },
  { pattern: /not enough (detail|depth)/i, replacement: 'in-depth analysis', description: 'Depth insufficient' },
  { pattern: /wrong (direction|focus|approach)/i, replacement: 'alternative perspective', description: 'Wrong direction' },
  { pattern: /focus on (.*)/i, replacement: '$1 detailed', description: 'Focus on specific aspect' },
];

export class QueryRewriter {
  private rules: RewriteRule[];

  constructor() {
    this.rules = [...DEFAULT_RULES];
  }

  rewrite(query: string, feedback: ProcessedFeedback): string[] {
    if (!query || !query.trim()) return [];

    if (feedback.action === 'continue' || feedback.action === 'halt') {
      return [query];
    }

    const results: string[] = [query];

    for (const rule of this.rules) {
      if (rule.pattern.test(query)) {
        const rewritten = query.replace(rule.pattern, rule.replacement);
        if (rewritten !== query && !results.includes(rewritten)) {
          results.push(rewritten);
        }
      }
    }

    // If feedback contains specific terms, append them
    const terms = feedback.adjustments
      .flatMap((a) => a.replace(/^(Redirect|Refine|Expand):\s*/i, '').split(/\s+/))
      .filter((t) => t.length > 3 && !results.some((r) => r.includes(t)));

    if (terms.length > 0) {
      results.push(`${query} ${terms.slice(0, 3).join(' ')}`);
    }

    return results.slice(0, 3);
  }

  rewriteBatch(queries: string[], feedbacks: ProcessedFeedback[]): string[] {
    const allResults = new Set<string>();
    for (const q of queries) {
      for (const fb of feedbacks) {
        for (const r of this.rewrite(q, fb)) {
          allResults.add(r);
        }
      }
    }
    return Array.from(allResults);
  }

  addRule(rule: RewriteRule): void {
    this.rules.push(rule);
  }

  getDefaultRules(): RewriteRule[] {
    return [...DEFAULT_RULES];
  }
}
