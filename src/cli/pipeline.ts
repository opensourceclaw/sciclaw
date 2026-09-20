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
// SciClaw v3.5.0 — Pipeline CLI Entry

import { Command } from "commander";
import { startPipeline } from "./commands/start.js";
import { showStatus } from "./commands/status.js";
import { approveStage } from "./commands/approve.js";
import { verifyPipeline } from "./commands/verify.js";

export const pipelineCommand = new Command("pipeline")
  .description("Manage research pipelines")
  .configureHelp({ sortSubcommands: true });

// Subcommand: create
pipelineCommand
  .command("create <topic>")
  .description("Create a new research pipeline")
  .option("-s, --sources <sources>", "Comma-separated list of sources")
  .option("-f, --format <format>", "Output format (markdown, html, pdf)", "markdown")
  .action((topic, options) => {
    startPipeline(topic, options);
  });

// Subcommand: start
pipelineCommand
  .command("start <pipeline-id>")
  .description("Start pipeline execution")
  .action(async (pipelineId: string) => {
    const { PipelineCoordinator } = await import("./pipeline-coordinator.js");
    const coordinator = new PipelineCoordinator();
    const state = coordinator.start(pipelineId);
    if (state) {
      console.log(`Pipeline ${pipelineId} started.`);
      console.log(`Current stage: ${state.currentStage}`);
    } else {
      console.error(`Pipeline not found: ${pipelineId}`);
      process.exit(1);
    }
  });

// Subcommand: status
pipelineCommand
  .command("status [pipeline-id]")
  .description("Show pipeline status")
  .option("-j, --json", "Output as JSON")
  .action((pipelineId, options) => {
    showStatus(pipelineId, options);
  });

// Subcommand: approve
pipelineCommand
  .command("approve <pipeline-id> <stage>")
  .description("Approve a pipeline stage")
  .action((pipelineId: string, stage: string) => {
    approveStage(pipelineId, stage);
  });

// Subcommand: verify
pipelineCommand
  .command("verify <pipeline-id>")
  .description("Run verification gate on pipeline")
  .action(async (pipelineId: string) => {
    await verifyPipeline(pipelineId);
  });

// Subcommand: list
pipelineCommand
  .command("list")
  .description("List all pipelines")
  .alias("ls")
  .action(() => {
    showStatus(undefined);
  });

// Subcommand: delete
pipelineCommand
  .command("delete <pipeline-id>")
  .description("Delete a pipeline")
  .alias("rm")
  .action(async (pipelineId: string) => {
    const { PipelineCoordinator } = await import("./pipeline-coordinator.js");
    const coordinator = new PipelineCoordinator();
    if (coordinator.delete(pipelineId)) {
      console.log(`Pipeline ${pipelineId} deleted.`);
    } else {
      console.error(`Pipeline not found: ${pipelineId}`);
      process.exit(1);
    }
  });
