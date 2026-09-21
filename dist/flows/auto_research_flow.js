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
// SciClaw v3.8.0 — Auto Research Flow (Autonomous, Breadth-First)
import { ResearchState, ResearchStrategy, } from "../orchestrator/types.js";
import { searchSubQueries, synthesizeResults } from "./wiring.js";
const STAGE_ORDER = ["plan", "search", "analyze", "synthesize", "report"];
/**
 * Autonomous research flow.
 * Breadth-first strategy, auto-approved gates, optimized for speed.
 */
export class AutoResearchFlow {
    context = null;
    searchResults = [];
    config;
    currentStage = "plan";
    stageDurations = new Map();
    stageStartTime = 0;
    constructor(config) {
        this.config = { maxDepth: 3, timeout: 120000, approvalRequired: false, ...config };
    }
    getCurrentStage() {
        return this.currentStage;
    }
    getProgress() {
        const idx = STAGE_ORDER.indexOf(this.currentStage);
        return idx >= 0 ? (idx + 1) / STAGE_ORDER.length : 0;
    }
    beginStage(stage) {
        this.currentStage = stage;
        this.stageStartTime = Date.now();
    }
    endStage() {
        this.stageDurations.set(this.currentStage, Date.now() - this.stageStartTime);
    }
    async start(topic) {
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
    async plan() {
        if (!this.context)
            throw new Error("Flow not started.");
        this.beginStage("plan");
        this.endStage();
        return {
            originalQuery: this.context.originalQuery,
            strategy: ResearchStrategy.BREADTH_FIRST,
            subQueries: this.context.subQueries,
            estimatedDepth: this.config.maxDepth || 1,
        };
    }
    async search() {
        if (!this.context)
            throw new Error("Flow not started.");
        this.beginStage("search");
        const resultSets = await searchSubQueries(this.context.subQueries, {
            maxQueries: this.context.subQueries.length,
            maxResults: 5,
            mock: this.config.mock,
        });
        this.searchResults = resultSets.flatMap((s) => s.results);
        this.context.results = this.searchResults;
        this.endStage();
        return resultSets;
    }
    async analyze() {
        if (!this.context)
            throw new Error("Flow not started.");
        this.beginStage("analyze");
        this.context.iteration++;
        this.endStage();
        return { claimsCount: 0, confidence: 0.7, blindSpots: [] };
    }
    async synthesize() {
        if (!this.context)
            throw new Error("Flow not started.");
        this.beginStage("synthesize");
        const synthesis = await synthesizeResults(this.context.originalQuery, this.searchResults, this.config.llm);
        this.endStage();
        return synthesis;
    }
    async run(originalQuery) {
        await this.start(originalQuery);
        const ctx = this.context;
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
//# sourceMappingURL=auto_research_flow.js.map