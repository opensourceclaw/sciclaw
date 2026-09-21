/**
 * SciClaw v3.9.0 — Bias Detection Gate
 *
 * GA R1 recalibration (Edith ga-r1-calibration.md §4/§6, Friday ratified C1–C5):
 *  - C1: selection denominator is UNIQUE urls (cross-sub-query re-feeds are not
 *    new evidence) — 1 − uniqueDomains / uniqueUrls.
 *  - C2: confirmation/temporal return `assessed:false` when no input variance
 *    exists (no counter-argument data / no publication dates). They keep their
 *    original score values but are EXCLUDED from aggregation — scoring a factor
 *    that is not measured would be manufacturing a reading.
 *  - C3: selection threshold 0.50 = observed legal-run upper bound (curated
 *    whitelist, single authoritative domain); it cannot detect single-domain
 *    curational bias — corpus extension is deferred (§5).
 *  - C4: structural floor uniqueUrls ≥ 2 — a single source cannot corroborate
 *    itself; the negative case is blocked structurally, not by threshold tuning.
 *  - C5: passed ⇔ uniqueUrls ≥ 2 ∧ every assessed factor within its threshold;
 *    score = mean of assessed factors (no assessed factor ⇒ fail).
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