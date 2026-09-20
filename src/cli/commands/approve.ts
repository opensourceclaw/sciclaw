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
// SciClaw v3.5.0 — Pipeline Approve Command

import { PipelineCoordinator } from "../pipeline-coordinator.js";
import { PipelineStage } from "../types.js";

/**
 * Approve a pipeline stage and advance to next.
 */
export function approveStage(pipelineId: string, stage: string): void {
  const coordinator = new PipelineCoordinator();

  const state = coordinator.get(pipelineId);
  if (!state) {
    console.error(`Pipeline not found: ${pipelineId}`);
    process.exit(1);
  }

  const stageEnum = stage as PipelineStage;
  if (!Object.values(PipelineStage).includes(stageEnum)) {
    console.error(`Invalid stage: ${stage}`);
    console.error(`Valid stages: ${Object.values(PipelineStage).join(", ")}`);
    process.exit(1);
  }

  try {
    const updated = coordinator.approve(pipelineId, stageEnum);
    if (updated) {
      console.log(`Stage ${stage} approved.`);
      console.log(`Current stage: ${updated.currentStage}`);
      console.log(`Pipeline status: ${updated.status}`);
    } else {
      console.error("Failed to approve stage.");
      process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
    process.exit(1);
  }
}
