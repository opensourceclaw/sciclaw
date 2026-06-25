import type { AdaptiveQuery, SessionContext, InteractionTurn, QueryResponse, InteractiveConfig } from "./types.js";
export declare class AdaptiveQueryEngine {
    private config;
    private totalGenerated;
    private totalPrioritySum;
    constructor(config?: Partial<InteractiveConfig>);
    generateQueries(context: SessionContext, history: InteractionTurn[]): AdaptiveQuery[];
    prioritizeQueries(queries: AdaptiveQuery[]): AdaptiveQuery[];
    adaptFromFeedback(queries: AdaptiveQuery[], feedback: QueryResponse[]): AdaptiveQuery[];
    getClarificationQueries(context: SessionContext): AdaptiveQuery[];
    getDirectionQueries(context: SessionContext): AdaptiveQuery[];
    getDepthQueries(context: SessionContext): AdaptiveQuery[];
    getValidationQueries(context: SessionContext): AdaptiveQuery[];
    private _getPreferenceQueries;
    getQueryStats(): {
        totalGenerated: number;
        avgPriority: number;
    };
}
export declare function createAdaptiveQueryEngine(config?: Partial<InteractiveConfig>): AdaptiveQueryEngine;
//# sourceMappingURL=queries.d.ts.map