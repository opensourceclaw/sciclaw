/**
 * SciClaw v3.9.0 — Research Gate Registry
 */
import type { ResearchGate, GateResult } from "./types.js";
import type { ResearchContext, ResearchStage } from "../../context/ResearchContext.js";
export declare class ResearchGateRegistry {
    private gates;
    constructor();
    private registerDefaultGates;
    register(gate: ResearchGate): void;
    get(name: string): ResearchGate | undefined;
    getByStage(stage: ResearchStage): ResearchGate[];
    getAll(): ResearchGate[];
    runAll(context: ResearchContext): Promise<Map<string, GateResult>>;
    runForStage(stage: ResearchStage, context: ResearchContext): Promise<Map<string, GateResult>>;
}
export declare const researchGateRegistry: ResearchGateRegistry;
//# sourceMappingURL=research-gate-registry.d.ts.map