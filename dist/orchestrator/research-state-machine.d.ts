/**
 * DeepClaw v3.9.0 — 7-Stage Research State Machine
 */
import type { ResearchContext, ResearchStage } from "../context/ResearchContext.js";
export declare class ResearchStateMachine {
    private currentStage;
    private context;
    private gateResults;
    constructor(initialContext?: Partial<ResearchContext>);
    transition(): Promise<{
        success: boolean;
        stage: ResearchStage;
        gateResults?: Map<string, boolean>;
    }>;
    getStage(): ResearchStage;
    getContext(): ResearchContext;
    updateContext(updates: Partial<ResearchContext>): void;
    getGateResults(): Map<string, boolean>;
    reset(): void;
    getAllStages(): ResearchStage[];
    getRemainingStages(): ResearchStage[];
    getProgress(): number;
    private initContext;
}
//# sourceMappingURL=research-state-machine.d.ts.map