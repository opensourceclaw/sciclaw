/**
 * SciClaw v3.9.0 — Cross Validation Gate
 */
import type { ResearchGate, GateResult } from "./types.js";
import type { ResearchContext, ResearchStage } from "../../context/ResearchContext.js";
export declare class CrossValidationGate implements ResearchGate {
    readonly name = "cross-validation";
    readonly stage: ResearchStage;
    check(context: ResearchContext): Promise<GateResult>;
    private findSupportingSources;
    private recommend;
}
//# sourceMappingURL=cross-validation-gate.d.ts.map