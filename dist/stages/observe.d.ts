/**
 * SciClaw v3.9.0 — OBSERVE Stage
 */
import type { ResearchContext } from "../context/ResearchContext.js";
export interface ObserveResult {
    topic: string;
    questions: string[];
    scope: string;
}
export declare function observeStage(input: string): Promise<ObserveResult>;
export declare function applyObserve(context: ResearchContext, result: ObserveResult): ResearchContext;
//# sourceMappingURL=observe.d.ts.map