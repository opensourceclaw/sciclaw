/**
 * SciClaw v3.9.0 — Research Gate Registry
 */

import type { ResearchGate, GateResult } from "./types.js";
import type { ResearchContext, ResearchStage } from "../../context/ResearchContext.js";
import { SourceCredibilityGate } from "./source-credibility-gate.js";
import { CrossValidationGate } from "./cross-validation-gate.js";
import { BiasDetectionGate } from "./bias-detection-gate.js";
import { CitationIntegrityGate } from "./citation-integrity-gate.js";

export class ResearchGateRegistry {
  private gates: Map<string, ResearchGate> = new Map();

  constructor() {
    this.registerDefaultGates();
  }

  private registerDefaultGates(): void {
    this.register(new SourceCredibilityGate());
    this.register(new CrossValidationGate());
    this.register(new BiasDetectionGate());
    this.register(new CitationIntegrityGate());
  }

  register(gate: ResearchGate): void {
    this.gates.set(gate.name, gate);
  }

  get(name: string): ResearchGate | undefined {
    return this.gates.get(name);
  }

  getByStage(stage: ResearchStage): ResearchGate[] {
    return Array.from(this.gates.values()).filter(g => g.stage === stage);
  }

  getAll(): ResearchGate[] {
    return Array.from(this.gates.values());
  }

  async runAll(context: ResearchContext): Promise<Map<string, GateResult>> {
    const results = new Map<string, GateResult>();
    for (const [name, gate] of this.gates) {
      const result = await gate.check(context);
      results.set(name, result);
    }
    return results;
  }

  async runForStage(stage: ResearchStage, context: ResearchContext): Promise<Map<string, GateResult>> {
    const results = new Map<string, GateResult>();
    const gates = this.getByStage(stage);
    for (const gate of gates) {
      const result = await gate.check(context);
      results.set(gate.name, result);
    }
    return results;
  }
}

export const researchGateRegistry = new ResearchGateRegistry();
