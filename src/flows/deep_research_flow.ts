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
// DeepClaw v3.9.0 — Deep Research Flow (Interactive, Depth-First)

import {
  ResearchState,
  ResearchStrategy,
  type ResearchContext,
  type SubQuery,
  type ResearchSearchResult,
  type BlindSpot,
} from "../orchestrator/types.js";
import { ResearchStateMachine } from "../orchestrator/research-state-machine.js";
import { observeStage } from "../stages/observe.js";
import { validateStage } from "../stages/validate.js";
import type { ValidationResult } from "../stages/validate.js";

export type ResearchStage = "plan" | "search" | "analyze" | "synthesize" | "report";

export interface DeepResearchConfig {
  maxDepth?: number;
  timeout?: number;
  approvalRequired?: boolean;
}

export interface ResearchPlan {
  originalQuery: string;
  strategy: ResearchStrategy;
  subQueries: SubQuery[];
  estimatedDepth: number;
}

export interface SearchResultSet {
  query: string;
  results: ResearchSearchResult[];
  timestamp: number;
}

export interface AnalysisResult {
  claimsCount: number;
  confidence: number;
  blindSpots: BlindSpot[];
}

export interface SynthesisResult {
  summary: string;
  keyInsights: string[];
  openQuestions: string[];
}

export interface ResearchReport {
  title: string;
  abstract: string;
  sections: Array<{ heading: string; content: string }>;
  references: string[];
}

export type ApprovalCallback = (step: string, details: string) => Promise<boolean>;

const STAGE_ORDER: ResearchStage[] = ["plan", "search", "analyze", "synthesize", "report"];

/**
 * Interactive deep research flow.
 * Depth-first strategy with human approval at each major step.
 */
export class DeepResearchFlow {
  private context: ResearchContext | null = null;
  private searchResults: ResearchSearchResult[] = [];
  private onApprove: ApprovalCallback;
  private config: DeepResearchConfig;
  private currentStage: ResearchStage = "plan";
  private stageDurations: Map<ResearchStage, number> = new Map();
  private stageStartTime: number = 0;
  private paused: boolean = false;

  constructor(approvalCallback?: ApprovalCallback, config?: DeepResearchConfig) {
    this.onApprove = approvalCallback ?? (async () => true);
    this.config = { maxDepth: 5, timeout: 300000, approvalRequired: true, ...config };
  }

  getCurrentStage(): ResearchStage {
    return this.currentStage;
  }

  getProgress(): number {
    const idx = STAGE_ORDER.indexOf(this.currentStage);
    return idx >= 0 ? (idx + 1) / STAGE_ORDER.length : 0;
  }

  getStageDurations(): Record<string, number> {
    return Object.fromEntries(this.stageDurations);
  }

  isPaused(): boolean {
    return this.paused;
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  private async assertNotPaused(): Promise<void> {
    while (this.paused) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  private beginStage(stage: ResearchStage): void {
    this.currentStage = stage;
    this.stageStartTime = Date.now();
  }

  private endStage(): void {
    this.stageDurations.set(this.currentStage, Date.now() - this.stageStartTime);
  }

  async start(topic: string): Promise<ResearchContext> {
    this.currentStage = "plan";
    this.context = {
      sessionId: `deep-${Date.now()}`,
      originalQuery: topic,
      subQueries: [],
      results: [],
      claims: [],
      blindSpots: [],
      iteration: 0,
      maxIterations: this.config.maxDepth || 5,
      minConfidence: 0.6,
      sources: ["duckduckgo"],
    };
    this.searchResults = [];
    return this.context;
  }

  async plan(): Promise<ResearchPlan> {
    await this.assertNotPaused();
    if (!this.context) throw new Error("Flow not started. Call start() first.");

    this.beginStage("plan");
    if (this.config.approvalRequired) {
      await this.requestApproval("PLAN", `Topic: ${this.context.originalQuery}`);
    }

    const subQueries: SubQuery[] = [
      { id: "sq-1", query: `overview of ${this.context.originalQuery}`, aspect: "overview", sources: ["duckduckgo"], priority: 1 },
      { id: "sq-2", query: `details of ${this.context.originalQuery}`, aspect: "details", sources: ["duckduckgo"], priority: 2 },
      { id: "sq-3", query: `recent developments in ${this.context.originalQuery}`, aspect: "recent", sources: ["duckduckgo"], priority: 3 },
    ];
    this.context.subQueries = subQueries;
    this.endStage();

    return {
      originalQuery: this.context.originalQuery,
      strategy: ResearchStrategy.DEPTH_FIRST,
      subQueries,
      estimatedDepth: this.config.maxDepth || 3,
    };
  }

  async search(): Promise<SearchResultSet[]> {
    await this.assertNotPaused();
    if (!this.context) throw new Error("Flow not started.");

    this.beginStage("search");
    if (this.config.approvalRequired) {
      await this.requestApproval("SEARCH", `Queries: ${this.context.subQueries.map(q => q.query).join(", ")}`);
    }

    const resultSets: SearchResultSet[] = [];
    for (const sq of this.context.subQueries.slice(0, 3)) {
      const results: ResearchSearchResult[] = [
        { title: `${sq.query} — Source 1`, url: `https://example.com/1`, snippet: "Relevant content found...", source: "duckduckgo" },
        { title: `${sq.query} — Source 2`, url: `https://example.com/2`, snippet: "Additional context...", source: "duckduckgo" },
      ];
      this.searchResults.push(...results);
      resultSets.push({ query: sq.query, results, timestamp: Date.now() });
    }

    this.context.results = this.searchResults;
    this.endStage();
    return resultSets;
  }

  async analyze(): Promise<AnalysisResult> {
    await this.assertNotPaused();
    if (!this.context) throw new Error("Flow not started.");

    this.beginStage("analyze");
    if (this.config.approvalRequired) {
      await this.requestApproval("ANALYZE", "Validating claims and detecting blind spots...");
    }

    const blindSpots: BlindSpot[] = [
      { id: "bs-1", aspect: "recent publications", reason: "uncovered", priority: 2, suggestedQueries: ["latest research"] },
      { id: "bs-2", aspect: "methodology", reason: "shallow", priority: 1, suggestedQueries: ["detailed methodology"] },
    ];
    this.context.blindSpots = blindSpots;
    this.context.iteration++;
    this.endStage();

    return {
      claimsCount: this.context.claims.length,
      confidence: 0.75,
      blindSpots,
    };
  }

  async synthesize(): Promise<SynthesisResult> {
    await this.assertNotPaused();
    if (!this.context) throw new Error("Flow not started.");

    this.beginStage("synthesize");
    if (this.config.approvalRequired) {
      await this.requestApproval("SYNTHESIZE", "Generating synthesis...");
    }
    this.endStage();

    return {
      summary: `Research synthesis for: ${this.context.originalQuery}`,
      keyInsights: ["Key insight 1", "Key insight 2", "Key insight 3"],
      openQuestions: ["Open question A", "Open question B"],
    };
  }

  async report(): Promise<ResearchReport> {
    await this.assertNotPaused();
    if (!this.context) throw new Error("Flow not started.");

    this.beginStage("report");
    if (this.config.approvalRequired) {
      await this.requestApproval("REPORT", "Final report generation");
    }
    this.endStage();
    this.currentStage = "report";

    return {
      title: `Deep Research: ${this.context.originalQuery}`,
      abstract: `An in-depth research report on ${this.context.originalQuery}.`,
      sections: [
        { heading: "Introduction", content: "..." },
        { heading: "Methodology", content: "Depth-first research strategy." },
        { heading: "Findings", content: "..." },
        { heading: "Conclusions", content: "..." },
      ],
      references: ["https://example.com/ref1", "https://example.com/ref2"],
    };
  }

  async requestApproval(step: string, details: string): Promise<boolean> {
    const approved = await this.onApprove(step, details);
    if (!approved) {
      throw new Error(`Approval denied for step: ${step}`);
    }
    return true;
  }

  // ── Phase 3: ResearchStateMachine + Stages ──────────────────────────

  private stateMachine: ResearchStateMachine | null = null;

  /**
   * Initialize state machine with context
   */
  initStateMachine(initialContext: Record<string, unknown> = {}): ResearchStateMachine {
    this.stateMachine = new ResearchStateMachine(initialContext as any);
    return this.stateMachine;
  }

  /**
   * Get current stage from state machine
   */
  getCurrentStageFromMachine(): string | null {
    return this.stateMachine?.getStage() ?? null;
  }

  /**
   * Get gate results
   */
  getGateResults(): Map<string, boolean> {
    return this.stateMachine?.getGateResults() ?? new Map();
  }

  /**
   * Run observe stage
   */
  async runObserve(input: string): Promise<void> {
    if (!this.stateMachine) {
      this.initStateMachine({ topic: input });
    }
    const result = await observeStage(input);
    this.stateMachine!.updateContext({ topic: result.topic, questions: result.questions } as any);
  }

  /**
   * Run validate stage
   */
  async runValidate(): Promise<ValidationResult> {
    if (!this.stateMachine) {
      throw new Error("State machine not initialized");
    }
    return validateStage(this.stateMachine.getContext());
  }
}
