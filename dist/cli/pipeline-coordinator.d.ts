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
import type { PipelineState, PipelineConfig } from "./types.js";
import { PipelineStage } from "./types.js";
/**
 * PipelineCoordinator manages pipeline state and stage transitions.
 */
export declare class PipelineCoordinator {
    private pipelinesDir;
    constructor(pipelinesDir?: string);
    /**
     * Create a new pipeline for a research topic.
     */
    create(topic: string, config?: Partial<PipelineConfig>): PipelineState;
    /**
     * Get pipeline by ID.
     */
    get(id: string): PipelineState | null;
    /**
     * Get the most recent pipeline.
     */
    getLatest(): PipelineState | null;
    /**
     * List all pipeline IDs.
     */
    listAll(): string[];
    /**
     * Start pipeline execution.
     */
    start(id: string): PipelineState | null;
    /**
     * Advance to next stage.
     */
    advance(id: string): PipelineState | null;
    /**
     * Approve current stage and advance.
     */
    approve(id: string, stage: PipelineStage): PipelineState | null;
    /**
     * Mark pipeline as failed.
     */
    fail(id: string, reason: string): PipelineState | null;
    /**
     * Delete pipeline.
     */
    delete(id: string): boolean;
    private save;
    private getFilePath;
    private listFiles;
    private ensureDir;
}
//# sourceMappingURL=pipeline-coordinator.d.ts.map