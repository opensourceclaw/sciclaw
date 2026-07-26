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
// DeepClaw v3.8.0 — Auto Research Flow (Autonomous, Breadth-First)

import {
  ResearchState,
  ResearchStrategy,
  type ResearchContext,
  type SubQuery,
  type ResearchSearchResult,
  type OrchestratorResult,
} from "../orchestrator/types.js";
import type { ResearchPlan, SearchResultSet, ResearchReport, DeepResearchConfig, ResearchStage } from "./deep_research_flow.js";
import type { AnalysisResult, SynthesisResult } from "./deep_research_flow.js";

const STAGE_ORDER: ResearchStage[] = ["plan", "search", "analyze", "synthesize", "report"];

/**
 * Autonomous research flow.
 * Breadth-first strategy, auto-approved gates, optimized for speed.
 */
export class AutoResearchFlow {
  private context: ResearchContext | null = null;
  private searchResults: ResearchSearchResult[] = [];
  private config: DeepResearchConfig;
  private currentStage: ResearchStage = "plan";
  private stageDurations: Map<ResearchStage, number> = new Map();
  private stageStartTime: number = 0;

  constructor(config?: DeepResearchConfig) {
    this.config = { maxDepth: 3, timeout: 120000, approvalRequired: false, ...config };
  }

  getCurrentStage(): ResearchStage {
    return this.currentStage;
  }

  getProgress(): number {
    const idx = STAGE_ORDER.indexOf(this.currentStage);
    return idx >= 0 ? (idx + 1) / STAGE_ORDER.length : 0;
  }

  private beginStage(stage: ResearchStage): void {
    this.currentStage = stage;
    this.stageStartTime = Date.now();
  }

  private endStage(): void {
    this.stageDurations.set(this.currentStage, Date.now() - this.stageStartTime);
  }

  async start(topic: string): Promise<ResearchContext> {
    this.context = {
      sessionId: `auto-${Date.now()}`,
      originalQuery: topic,
      subQueries: [
        { id: "aq-1", query: topic, aspect: "main", sources: ["duckduckgo"], priority: 1 },
        { id: "aq-2", query: `${topic} latest`, aspect: "latest", sources: ["duckduckgo"], priority: 2 },
        { id: "aq-3", query: `${topic} overview`, aspect: "overview", sources: ["duckduckgo"], priority: 3 },
      ],
      results: [],
      claims: [],
      blindSpots: [],
      iteration: 0,
      maxIterations: this.config.maxDepth || 3,
      minConfidence: 0.5,
      sources: ["duckduckgo"],
    };
    return this.context;
  }

  async plan(): Promise<ResearchPlan> {
    if (!this.context) throw new Error("Flow not started.");
    this.beginStage("plan");
    this.endStage();
    return {
      originalQuery: this.context.originalQuery,
      strategy: ResearchStrategy.BREADTH_FIRST,
      subQueries: this.context.subQueries,
      estimatedDepth: this.config.maxDepth || 1,
    };
  }

  async search(): Promise<SearchResultSet[]> {
    if (!this.context) throw new Error("Flow not started.");
    this.beginStage("search");
    const resultSets: SearchResultSet[] = this.context.subQueries.map(q => ({
      query: q.query,
      results: [
        { title: `Quick: ${q.query}`, url: `https://example.com/1`, snippet: "Auto-research result.", source: "duckduckgo" },
      ],
      timestamp: Date.now(),
    }));
    this.searchResults = resultSets.flatMap(s => s.results);
    this.context.results = this.searchResults;
    this.endStage();
    return resultSets;
  }

  async analyze(): Promise<AnalysisResult> {
    if (!this.context) throw new Error("Flow not started.");
    this.beginStage("analyze");
    this.context.iteration++;
    this.endStage();
    return { claimsCount: 0, confidence: 0.7, blindSpots: [] };
  }

  async synthesize(): Promise<SynthesisResult> {
    if (!this.context) throw new Error("Flow not started.");
    this.beginStage("synthesize");
    this.endStage();
    return {
      summary: `Auto-research: ${this.context.originalQuery}`,
      keyInsights: ["Quick insight"],
      openQuestions: [],
    };
  }

  async run(originalQuery: string): Promise<OrchestratorResult> {
    await this.start(originalQuery);
    const ctx = this.context!;
    await this.plan();
    await this.search();
    await this.analyze();
    await this.synthesize();
    this.currentStage = "report";

    return {
      sessionId: ctx.sessionId,
      conclusion: `Auto-research completed for: ${originalQuery}`,
      confidence: 0.7,
      claims: [],
      iterations: 1,
      blindSpotsRemaining: [],
      searchResults: this.searchResults,
      durationMs: Date.now() - (this.stageStartTime > 0 ? this.stageStartTime : Date.now()),
      stateHistory: [{ state: ResearchState.DONE, timestamp: Date.now() }],
    };
  }
}
