/**
 * SciClaw v3.3.0 — Dynamic Planner
 *
 * Decomposes queries, selects search strategy, and detects pivot signals.
 * Supports 4 strategies: breadth-first, depth-first, tree-search, pivot.
 */
import type { ResearchContext, SubQuery, PivotSignal } from "./types.js";
import { ResearchStrategy } from "./types.js";
export interface PlannerConfig {
    maxSubQueries: number;
    minRelevanceThreshold: number;
    pivotConfidenceDropThreshold: number;
    allowedStrategies: ResearchStrategy[];
}
export declare class DynamicPlanner {
    private currentStrategy;
    private config;
    constructor(config?: Partial<PlannerConfig>);
    decompose(query: string, context: ResearchContext): SubQuery[];
    selectStrategy(context: ResearchContext): string;
    shouldPivot(context: ResearchContext): boolean;
    onPivot(context: ResearchContext): {
        newQuery: string;
    }[];
    detectPivotSignals(context: ResearchContext): PivotSignal[];
    getCurrentStrategy(): ResearchStrategy;
}
export declare function createDynamicPlanner(config?: Partial<PlannerConfig>): DynamicPlanner;
//# sourceMappingURL=planner.d.ts.map