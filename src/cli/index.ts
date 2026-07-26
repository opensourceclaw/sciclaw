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
// DeepClaw v3.8.0 — CLI Entry

import { Command } from "commander";
import { pipelineCommand } from "./pipeline.js";
import { DeepResearchFlow } from "../flows/deep_research_flow.js";
import { AutoResearchFlow } from "../flows/auto_research_flow.js";

interface ResearchOptions {
  mode: string;
  maxDepth: string;
  timeout: string;
}

const program = new Command();

program
  .name("deepclaw")
  .description("DeepClaw — Multi-Agent Deep Research Platform")
  .version("3.8.0");

// Research command
program
  .command("research <topic>")
  .description("Conduct deep research on a topic")
  .option("--mode <mode>", "Research mode: deep | auto", "deep")
  .option("--max-depth <number>", "Maximum research depth", "5")
  .option("--timeout <seconds>", "Research timeout in seconds", "300")
  .action(async (topic: string, options: ResearchOptions) => {
    const validModes = ["deep", "auto"];
    if (!validModes.includes(options.mode)) {
      console.error(`Error: Invalid mode '${options.mode}'. Valid: ${validModes.join(", ")}`);
      process.exit(1);
    }

    console.log(`DeepClaw Research: "${topic}"`);
    console.log(`   Mode: ${options.mode}, Max Depth: ${options.maxDepth}, Timeout: ${options.timeout}s`);

    if (options.mode === "auto") {
      const flow = new AutoResearchFlow({
        maxDepth: parseInt(options.maxDepth) || 3,
        timeout: parseInt(options.timeout) * 1000 || 120000,
      });
      console.log("   Auto mode — breadth-first, autonomous");
      const result = await flow.run(topic);
      console.log(`   Complete — confidence: ${result.confidence}, iterations: ${result.iterations}`);
    } else {
      const flow = new DeepResearchFlow(async (step, details) => {
        console.log(`   Approval: ${step} — ${details}`);
        console.log(`   Auto-approved (CLI mode)`);
        return true;
      }, {
        maxDepth: parseInt(options.maxDepth) || 5,
        timeout: parseInt(options.timeout) * 1000 || 300000,
      });

      await flow.start(topic);
      const plan = await flow.plan();
      console.log(`   Plan: ${plan.strategy} strategy, ${plan.subQueries.length} sub-queries`);

      const searchResults = await flow.search();
      console.log(`   Found ${searchResults.length} result sets`);

      const analysis = await flow.analyze();
      console.log(`   Analysis: ${analysis.claimsCount} claims, confidence ${analysis.confidence}`);

      const synthesis = await flow.synthesize();
      console.log(`   Synthesis: ${synthesis.keyInsights.length} insights`);

      const report = await flow.report();
      console.log(`   Report: ${report.sections.length} sections, ${report.references.length} references`);
      console.log(`   Deep research complete. Progress: ${Math.round(flow.getProgress() * 100)}%`);
    }
  });

// Pipeline command
program.addCommand(pipelineCommand);

program.parse();
