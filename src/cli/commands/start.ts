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
// DeepClaw v3.5.0 — Pipeline Start Command

import { PipelineCoordinator } from "../pipeline-coordinator.js";
import { PipelineStage } from "../types.js";

export interface StartOptions {
  sources?: string;
  format?: "markdown" | "html" | "pdf";
}

/**
 * Start a new research pipeline.
 */
export function startPipeline(topic: string, options: StartOptions = {}): void {
  const coordinator = new PipelineCoordinator();

  const state = coordinator.create(topic, {
    sources: options.sources?.split(",") ?? ["duckduckgo"],
    outputFormat: options.format ?? "markdown",
  });

  console.log(`Pipeline created: ${state.id}`);
  console.log(`Topic: ${topic}`);
  console.log(`Status: ${state.status}`);
  console.log(`Stage: ${state.currentStage}`);
  console.log("");
  console.log("To start execution:");
  console.log(`  deepclaw pipeline start ${state.id}`);
  console.log("");
  console.log("To check status:");
  console.log(`  deepclaw pipeline status ${state.id}`);
}
