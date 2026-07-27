/**
 * DeepClaw v3.9.0 — Bias Detection Gate
 */
import type { ResearchGate, GateResult } from "./types.js";
import type { ResearchContext, ResearchStage } from "../../context/ResearchContext.js";
export declare class BiasDetectionGate implements ResearchGate {
    readonly name = "bias-detection";
    readonly stage: ResearchStage;
    check(context: ResearchContext): Promise<GateResult>;
    private checkSelectionBias;
    private checkConfirmationBias;
    private checkTemporalBias;
    private extractDomain;
    private recommendMitigations;
}
//# sourceMappingURL=bias-detection-gate.d.ts.map