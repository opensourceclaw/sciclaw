/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Copyright 2026 Peter Cheng
// SciClaw v3.8.0 — Gate Strategy for Flow Separation

export interface Gate {
  id: string;
  name: string;
  stage: string;
  required: boolean;
}

export interface GateStrategy {
  name: string;
  getGates(): Gate[];
  shouldApprove(stage: string): boolean;
  execute(stage: string): Promise<boolean>;
}

const RESEARCH_GATES: Gate[] = [
  { id: "plan-gate", name: "Plan Approval", stage: "PLAN", required: true },
  { id: "search-gate", name: "Search Verification", stage: "SEARCH", required: true },
  { id: "analyze-gate", name: "Analysis Validation", stage: "ANALYZE", required: true },
  { id: "synthesize-gate", name: "Synthesis Review", stage: "SYNTHESIZE", required: true },
  { id: "report-gate", name: "Report Approval", stage: "REPORT", required: true },
];

export class DeepResearchGateStrategy implements GateStrategy {
  name = "deep-research";

  getGates(): Gate[] {
    return RESEARCH_GATES;
  }

  shouldApprove(_stage: string): boolean {
    // Always require human approval in deep mode
    return false;
  }

  async execute(stage: string): Promise<boolean> {
    // In deep mode, approval comes from human interaction
    // This method is called by the flow to check if approval was granted
    return false; // Default: not auto-approved
  }
}

export class AutoResearchGateStrategy implements GateStrategy {
  name = "auto-research";

  getGates(): Gate[] {
    return RESEARCH_GATES.map(g => ({ ...g, required: false }));
  }

  shouldApprove(_stage: string): boolean {
    // Auto-approve all gates
    return true;
  }

  async execute(stage: string): Promise<boolean> {
    // Auto-approved — log for audit
    console.log(`[auto-research] Gate auto-approved: ${stage}`);
    return true;
  }
}

export function createGateStrategy(mode: "deep" | "auto"): GateStrategy {
  return mode === "auto" ? new AutoResearchGateStrategy() : new DeepResearchGateStrategy();
}
