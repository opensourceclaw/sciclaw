/**
 * DeepClaw v3.9.0 — Research Gate Types
 */
import type { ResearchContext, ResearchStage } from "../../context/ResearchContext.js";
export interface ResearchGate {
    readonly name: string;
    readonly stage: ResearchStage;
    check(context: ResearchContext): Promise<GateResult>;
}
export interface GateResult {
    passed: boolean;
    score: number;
    threshold: number;
    details: GateDetail[];
    recommendations?: string[];
}
export interface GateDetail {
    item: string;
    score: number;
    reason: string;
}
export declare class GateNotPassedException extends Error {
    readonly gateName: string;
    readonly result: GateResult;
    constructor(gateName: string, result: GateResult);
}
//# sourceMappingURL=types.d.ts.map