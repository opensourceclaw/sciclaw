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
// SciClaw v3.5.0 — Pipeline Status Command

import { PipelineCoordinator } from "../pipeline-coordinator.js";

export interface StatusOptions {
  json?: boolean;
}

/**
 * Show pipeline status.
 */
export function showStatus(pipelineId?: string, options: StatusOptions = {}): void {
  const coordinator = new PipelineCoordinator();

  if (pipelineId) {
    const state = coordinator.get(pipelineId);
    if (!state) {
      console.error(`Pipeline not found: ${pipelineId}`);
      process.exit(1);
    }

    if (options.json) {
      console.log(JSON.stringify(state, null, 2));
      return;
    }

    console.log(`Pipeline: ${state.id}`);
    console.log(`Topic: ${state.topic}`);
    console.log(`Status: ${state.status}`);
    console.log(`Current Stage: ${state.currentStage}`);
    console.log(`Created: ${new Date(state.createdAt).toISOString()}`);
    console.log(`Updated: ${new Date(state.updatedAt).toISOString()}`);
    console.log("");
    console.log("Stages:");
    for (const stage of state.stages) {
      const icon = stage.status === "completed" ? "✓" :
                   stage.status === "running" ? "→" :
                   stage.status === "failed" ? "✗" : "○";
      console.log(`  ${icon} ${stage.stage}: ${stage.status}`);
    }
  } else {
    // List all pipelines
    const pipelines = coordinator.listAll();

    if (pipelines.length === 0) {
      console.log("No pipelines found.");
      console.log("");
      console.log("Create a new pipeline:");
      console.log("  sciclaw pipeline create <topic>");
      return;
    }

    console.log("Pipelines:");
    for (const id of pipelines) {
      const state = coordinator.get(id);
      if (state) {
        const icon = state.status === "completed" ? "✓" :
                     state.status === "running" ? "→" :
                     state.status === "failed" ? "✗" : "○";
        console.log(`  ${icon} ${id}: ${state.topic} (${state.status})`);
      }
    }
  }
}
