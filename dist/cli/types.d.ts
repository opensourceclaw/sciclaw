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
/** Pipeline stages for research workflow */
export declare enum PipelineStage {
    PLAN = "plan",
    SEARCH = "search",
    SYNTHESIZE = "synthesize",
    WRITE = "write",
    VERIFY = "verify"
}
/** Pipeline status */
export type PipelineStatus = "pending" | "running" | "paused" | "completed" | "failed";
/** Pipeline state */
export interface PipelineState {
    id: string;
    topic: string;
    status: PipelineStatus;
    currentStage: PipelineStage;
    createdAt: number;
    updatedAt: number;
    stages: StageState[];
}
/** Stage state */
export interface StageState {
    stage: PipelineStage;
    status: "pending" | "running" | "completed" | "failed";
    startedAt?: number;
    completedAt?: number;
    output?: string;
}
/** Pipeline configuration */
export interface PipelineConfig {
    maxIterations: number;
    sources: string[];
    outputFormat: "markdown" | "html" | "pdf";
    verifyEnabled: boolean;
}
export declare const DEFAULT_PIPELINE_CONFIG: PipelineConfig;
//# sourceMappingURL=types.d.ts.map