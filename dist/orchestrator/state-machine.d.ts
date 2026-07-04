/**
 * DeepClaw v3.3.0 — Research State Machine
 *
 * Lightweight hand-written FSM managing the PLAN → SEARCH → ANALYZE → REFINE cycle.
 * Zero external dependencies.
 */
import type { ResearchContext, OrchestratorResult, ResearchConfig, SubQuery, ResearchSearchResult, ValidatedClaim, BlindSpot, RefinementResult } from "./types.js";
import { ResearchState as State } from "./types.js";
export interface Planner {
    decompose(query: string, context: ResearchContext): SubQuery[];
    selectStrategy(context: ResearchContext): string;
    shouldPivot(context: ResearchContext): boolean;
    onPivot(context: ResearchContext): {
        newQuery: string;
    }[];
}
export interface Searcher {
    search(subQueries: SubQuery[], context: ResearchContext): Promise<ResearchSearchResult[]>;
}
import type { RawClaim } from "./types.js";
export interface Validator {
    extractClaims(results: ResearchSearchResult[]): RawClaim[];
    validate(claims: RawClaim[], results: ResearchSearchResult[]): ValidatedClaim[];
}
export interface BlindSpotDetector {
    detect(context: ResearchContext): BlindSpot[];
}
export interface Refiner {
    refine(context: ResearchContext): RefinementResult;
}
export declare class ResearchStateMachine {
    private planner;
    private searcher;
    private validator;
    private blindSpotDetector;
    private refiner;
    private current;
    private context;
    private history;
    private transitions;
    private startedAt;
    constructor(context: ResearchContext, planner: Planner, searcher: Searcher, validator: Validator, blindSpotDetector: BlindSpotDetector, refiner: Refiner);
    getState(): State;
    getContext(): ResearchContext;
    getHistory(): ReadonlyArray<{
        state: State;
        timestamp: number;
    }>;
    abort(): void;
    run(): Promise<OrchestratorResult>;
    private executeCurrentState;
    private step;
    private buildResult;
    private buildConclusion;
    private averageConfidence;
}
export declare function createResearchStateMachine(query: string, planner: Planner, searcher: Searcher, validator: Validator, blindSpotDetector: BlindSpotDetector, refiner: Refiner, config?: Partial<ResearchConfig>): ResearchStateMachine;
//# sourceMappingURL=state-machine.d.ts.map