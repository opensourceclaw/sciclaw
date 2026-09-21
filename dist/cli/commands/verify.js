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
// SciClaw v3.5.0 — Pipeline Verify Command
import { GateRegistry } from "../../gate/GateRegistry.js";
import { InternalVerifyGate } from "../../gate/gates/InternalVerifyGate.js";
import { PipelineCoordinator } from "../pipeline-coordinator.js";
import { PipelineStage } from "../types.js";
import { collectVerifySubmission } from "./verify-artifacts.js";
/**
 * Run verification gate on pipeline.
 */
export async function verifyPipeline(pipelineId) {
    const coordinator = new PipelineCoordinator();
    const state = coordinator.get(pipelineId);
    if (!state) {
        console.error(`Pipeline not found: ${pipelineId}`);
        process.exit(1);
    }
    if (state.currentStage !== PipelineStage.VERIFY) {
        console.error(`Pipeline is not in verify stage. Current stage: ${state.currentStage}`);
        process.exit(1);
    }
    // GA-A6: collect REAL artifacts — typecheck/build/test run live; version,
    // regression baseline and quality checks come from real sources (no literals).
    console.log("Collecting real check artifacts (typecheck / build / test)…");
    const submission = collectVerifySubmission(state.id);
    const t = submission.tests;
    console.log(`   typecheck: ${submission.typeCheck.passed ? "passed" : "FAILED"} (${submission.typeCheck.errors} errors)`);
    console.log(`   build: ${submission.build.passed ? "passed" : "FAILED"}`);
    console.log(`   tests: ${t.passed}/${t.total} passed${t.failed ? `, ${t.failed} failed` : ""}${t.skipped ? `, ${t.skipped} skipped` : ""}`);
    console.log(`   quality: chineseChars=${submission.qualityChecks.hasChineseChars} hardcodedPaths=${submission.qualityChecks.hasHardcodedPaths} missingHeaders=${submission.qualityChecks.hasMissingApacheHeaders}`);
    console.log("Running internal verification...");
    const registry = new GateRegistry();
    const gate = new InternalVerifyGate(registry);
    try {
        await gate.submit(submission);
        console.log("✓ Verification passed");
        coordinator.approve(pipelineId, PipelineStage.VERIFY);
        console.log("Pipeline completed successfully.");
    }
    catch (err) {
        console.error("✗ Verification failed");
        console.error(err.message);
        coordinator.fail(pipelineId, err.message);
        process.exit(1);
    }
}
//# sourceMappingURL=verify.js.map