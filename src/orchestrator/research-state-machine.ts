/**
 * DeepClaw v3.9.0 — 7-Stage Research State Machine
 */

import { researchGateRegistry } from "../gate/research/research-gate-registry.js";
import { metricsCollector } from "../observe/MetricsCollector.js";
import type { ResearchContext, ResearchStage } from "../context/ResearchContext.js";

const STAGE_ORDER: ResearchStage[] = [
  "observe", "plan", "search", "extract",
  "synthesize", "validate", "report",
];

export class ResearchStateMachine {
  private currentStage: ResearchStage = "observe";
  private context: ResearchContext;
  private gateResults: Map<string, boolean> = new Map();

  constructor(initialContext: Partial<ResearchContext> = {}) {
    this.context = this.initContext(initialContext);
  }

  async transition(): Promise<{ success: boolean; stage: ResearchStage; gateResults?: Map<string, boolean> }> {
    const gates = researchGateRegistry.getByStage(this.currentStage);
    for (const gate of gates) {
      const result = await gate.check(this.context);
      metricsCollector.recordGateResult(gate.name, result.passed);
      if (!result.passed) {
        return { success: false, stage: this.currentStage, gateResults: this.gateResults };
      }
      this.gateResults.set(gate.name, result.passed);
    }
    const currentIndex = STAGE_ORDER.indexOf(this.currentStage);
    if (currentIndex < STAGE_ORDER.length - 1) {
      this.currentStage = STAGE_ORDER[currentIndex + 1]!;
      return { success: true, stage: this.currentStage };
    }
    return { success: true, stage: "report" };
  }

  getStage(): ResearchStage {
    return this.currentStage;
  }

  getContext(): ResearchContext {
    return this.context;
  }

  updateContext(updates: Partial<ResearchContext>): void {
    this.context = { ...this.context, ...updates };
  }

  getGateResults(): Map<string, boolean> {
    return new Map(this.gateResults);
  }

  reset(): void {
    this.currentStage = "observe";
    this.gateResults.clear();
  }

  getAllStages(): ResearchStage[] {
    return [...STAGE_ORDER];
  }

  getRemainingStages(): ResearchStage[] {
    const idx = STAGE_ORDER.indexOf(this.currentStage);
    return idx >= 0 ? STAGE_ORDER.slice(idx) : [];
  }

  getProgress(): number {
    const idx = STAGE_ORDER.indexOf(this.currentStage);
    return idx >= 0 ? (idx) / STAGE_ORDER.length : 0;
  }

  private initContext(initial: Partial<ResearchContext>): ResearchContext {
    return {
      topic: initial.topic ?? "",
      questions: initial.questions ?? [],
      searchResults: initial.searchResults ?? [],
      extractions: initial.extractions ?? [],
      stage: initial.stage ?? "observe",
    };
  }
}
