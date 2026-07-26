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
import { type ResearchContext, type OrchestratorResult } from "../orchestrator/types.js";
import type { ResearchPlan, SearchResultSet, DeepResearchConfig, ResearchStage } from "./deep_research_flow.js";
import type { AnalysisResult, SynthesisResult } from "./deep_research_flow.js";
/**
 * Autonomous research flow.
 * Breadth-first strategy, auto-approved gates, optimized for speed.
 */
export declare class AutoResearchFlow {
    private context;
    private searchResults;
    private config;
    private currentStage;
    private stageDurations;
    private stageStartTime;
    constructor(config?: DeepResearchConfig);
    getCurrentStage(): ResearchStage;
    getProgress(): number;
    private beginStage;
    private endStage;
    start(topic: string): Promise<ResearchContext>;
    plan(): Promise<ResearchPlan>;
    search(): Promise<SearchResultSet[]>;
    analyze(): Promise<AnalysisResult>;
    synthesize(): Promise<SynthesisResult>;
    run(originalQuery: string): Promise<OrchestratorResult>;
}
//# sourceMappingURL=auto_research_flow.d.ts.map