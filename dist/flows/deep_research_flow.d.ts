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
import { ResearchStrategy, type ResearchContext, type SubQuery, type ResearchSearchResult, type BlindSpot } from "../orchestrator/types.js";
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
    sections: Array<{
        heading: string;
        content: string;
    }>;
    references: string[];
}
export type ApprovalCallback = (step: string, details: string) => Promise<boolean>;
/**
 * Interactive deep research flow.
 * Depth-first strategy with human approval at each major step.
 */
export declare class DeepResearchFlow {
    private context;
    private searchResults;
    private onApprove;
    private config;
    private currentStage;
    private stageDurations;
    private stageStartTime;
    private paused;
    constructor(approvalCallback?: ApprovalCallback, config?: DeepResearchConfig);
    getCurrentStage(): ResearchStage;
    getProgress(): number;
    getStageDurations(): Record<string, number>;
    isPaused(): boolean;
    pause(): void;
    resume(): void;
    private assertNotPaused;
    private beginStage;
    private endStage;
    start(topic: string): Promise<ResearchContext>;
    plan(): Promise<ResearchPlan>;
    search(): Promise<SearchResultSet[]>;
    analyze(): Promise<AnalysisResult>;
    synthesize(): Promise<SynthesisResult>;
    report(): Promise<ResearchReport>;
    requestApproval(step: string, details: string): Promise<boolean>;
}
//# sourceMappingURL=deep_research_flow.d.ts.map