/**
 * Query Expander - Expands queries with synonyms and related terms
 */
import type { ExpansionResult } from './types.js';
export declare class QueryExpander {
    private synonymMap;
    constructor();
    expand(query: string, maxExpansions?: number): ExpansionResult;
    expandBatch(queries: string[], maxExpansions?: number): ExpansionResult[];
    addSynonym(term: string, synonyms: string[]): void;
    getDefaultSynonyms(): Map<string, string[]>;
}
//# sourceMappingURL=expander.d.ts.map