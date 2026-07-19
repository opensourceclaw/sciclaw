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
// DeepClaw v3.5.0 — Pipeline Types
/** Pipeline stages for research workflow */
export var PipelineStage;
(function (PipelineStage) {
    PipelineStage["PLAN"] = "plan";
    PipelineStage["SEARCH"] = "search";
    PipelineStage["SYNTHESIZE"] = "synthesize";
    PipelineStage["WRITE"] = "write";
    PipelineStage["VERIFY"] = "verify";
})(PipelineStage || (PipelineStage = {}));
export const DEFAULT_PIPELINE_CONFIG = {
    maxIterations: 5,
    sources: ["duckduckgo"],
    outputFormat: "markdown",
    verifyEnabled: true,
};
//# sourceMappingURL=types.js.map