/**
 * SciClaw v3.9.0 — Research Gate Types
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
  /** Structural failure cause when passed=false for a non-score reason (R1 C4). */
  reason?: string;
}

export interface GateDetail {
  item: string;
  score: number;
  reason: string;
  /** Per-factor decision threshold (present on gating factors). */
  threshold?: number;
  /** false = not assessable from available data — kept out of aggregation (R1 C2). */
  assessed?: boolean;
}

export class GateNotPassedException extends Error {
  constructor(
    public readonly gateName: string,
    public readonly result: GateResult,
  ) {
    super(`Gate ${gateName} not passed: score ${result.score} < threshold ${result.threshold}`);
    this.name = "GateNotPassedException";
  }
}
