/**
 * DeepClaw v3.0.0 — Interactive Research Engine
 *
 * Unified engine coordinating human-in-the-loop, adaptive queries,
 * and real-time feedback.
 */
import type { InteractionSession, InteractionMode, UserInput, ResearchUpdate, AdaptiveQuery, InteractiveConfig } from "./types.js";
import { HumanInLoopAdapter } from "./adapter.js";
import { AdaptiveQueryEngine } from "./queries.js";
import { RealTimeFeedback } from "./feedback.js";
export * from "./types.js";
export * from "./adapter.js";
export * from "./queries.js";
export * from "./feedback.js";
export interface InteractiveResearchConfig {
    adapter?: Partial<InteractiveConfig>;
    queries?: Partial<InteractiveConfig>;
    feedback?: Partial<InteractiveConfig>;
}
export declare class InteractiveResearchEngine {
    private adapter;
    private queryEngine;
    private feedbackHandler;
    constructor(config?: InteractiveResearchConfig);
    start(topic: string, userId: string, mode?: InteractionMode): InteractionSession;
    endSession(sessionId: string): InteractionSession;
    getSession(sessionId: string): InteractionSession | undefined;
    processInput(sessionId: string, input: UserInput): ResearchUpdate;
    generateAdaptiveQuery(sessionId: string): AdaptiveQuery[];
    startResearch(topic: string, userId: string, mode?: InteractionMode): {
        session: InteractionSession;
        initialQueries: AdaptiveQuery[];
    };
    getStats(): {
        activeSessions: number;
        totalTurns: number;
        avgLatency: number;
    };
    getAdapter(): HumanInLoopAdapter;
    getQueryEngine(): AdaptiveQueryEngine;
    getFeedbackHandler(): RealTimeFeedback;
}
export declare function createInteractiveResearchEngine(config?: InteractiveResearchConfig): InteractiveResearchEngine;
//# sourceMappingURL=index.d.ts.map