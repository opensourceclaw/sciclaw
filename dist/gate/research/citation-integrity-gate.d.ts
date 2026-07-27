/**
 * DeepClaw v3.9.0 — Citation Integrity Gate
 */
import type { ResearchGate, GateResult } from "./types.js";
import type { ResearchContext, ResearchStage } from "../../context/ResearchContext.js";
export declare class CitationIntegrityGate implements ResearchGate {
    readonly name = "citation-integrity";
    readonly stage: ResearchStage;
    check(context: ResearchContext): Promise<GateResult>;
    private checkCitation;
    private explainCitationScore;
    private findIssues;
}
//# sourceMappingURL=citation-integrity-gate.d.ts.map