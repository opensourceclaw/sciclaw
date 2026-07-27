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

export class GateNotPassedException extends Error {
  constructor(
    public readonly gateName: string,
    public readonly result: GateResult,
  ) {
    super(`Gate ${gateName} not passed: score ${result.score} < threshold ${result.threshold}`);
    this.name = "GateNotPassedException";
  }
}
