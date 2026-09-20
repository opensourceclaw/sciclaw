/**
 * SciClaw v3.3.0 — Blind Spot Detector
 *
 * 7 heuristic rules for detecting information gaps in research results.
 */
import type { ResearchContext, BlindSpot, CompletenessReport } from "./types.js";
interface BlindSpotRule {
    name: string;
    weight: number;
    detect(ctx: ResearchContext): BlindSpot[];
}
export declare class BlindSpotDetector {
    private rules;
    constructor(rules?: BlindSpotRule[]);
    /** Run all detection rules and return aggregated blind spots. */
    detect(context: ResearchContext): BlindSpot[];
    /** Prioritize blind spots by weight * priority. */
    prioritize(spots: BlindSpot[]): BlindSpot[];
    /** Suggest queries for a specific blind spot. */
    suggestQueries(spot: BlindSpot): string[];
    /** Generate a completeness report for the current context. */
    generateCompletenessReport(context: ResearchContext): CompletenessReport;
    private deduplicate;
}
export declare function createBlindSpotDetector(): BlindSpotDetector;
export {};
//# sourceMappingURL=blindspot.d.ts.map