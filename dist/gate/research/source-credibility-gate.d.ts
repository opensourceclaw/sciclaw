/**
 * SciClaw v3.9.0 — Source Credibility Gate
 */
import type { ResearchGate, GateResult } from "./types.js";
import type { ResearchContext, ResearchStage } from "../../context/ResearchContext.js";
export declare class SourceCredibilityGate implements ResearchGate {
    readonly name = "source-credibility";
    readonly stage: ResearchStage;
    check(context: ResearchContext): Promise<GateResult>;
    private scoreSource;
    private scoreDomain;
    private scoreRecency;
    private extractDomain;
    private explainScore;
    private recommend;
}
//# sourceMappingURL=source-credibility-gate.d.ts.map