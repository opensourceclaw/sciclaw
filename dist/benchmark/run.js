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
// SciClaw v4.0.0 — GA-A3: `npm run benchmark` entry. Runs the default task set
// through the REAL research pipeline and writes benchmark-results.json.
import { writeFileSync } from "node:fs";
import { BenchmarkRunner } from "./runner.js";
const DEFAULT_TASKS = [
    {
        id: "factuality-quantum",
        name: "Quantum computing fundamentals",
        category: "factuality",
        description: "Factual grounding of a quantum-computing research run.",
        input: {
            topic: "quantum computing fundamentals",
            expectedFacts: ["quantum", "qubit"],
            expectedSources: [],
            minSections: 2,
            minCitations: 1,
        },
        scoring: { factualityWeight: 0.5, completenessWeight: 0.2, citationWeight: 0.2, reasoningWeight: 0.1, threshold: 0.35 },
    },
    {
        id: "completeness-photosynthesis",
        name: "Photosynthesis process coverage",
        category: "completeness",
        description: "Section and source coverage of a life-science research run.",
        input: {
            topic: "photosynthesis process",
            expectedFacts: ["photosynthesis"],
            expectedSources: [],
            minSections: 2,
            minCitations: 1,
        },
        scoring: { factualityWeight: 0.3, completenessWeight: 0.4, citationWeight: 0.2, reasoningWeight: 0.1, threshold: 0.35 },
    },
    {
        id: "citation-energy-storage",
        name: "Grid energy storage citations",
        category: "citation",
        description: "Citation quality of an engineering research run.",
        input: {
            topic: "grid energy storage technologies",
            expectedFacts: ["battery"],
            expectedSources: [],
            minSections: 2,
            minCitations: 2,
        },
        scoring: { factualityWeight: 0.3, completenessWeight: 0.2, citationWeight: 0.4, reasoningWeight: 0.1, threshold: 0.3 },
    },
];
const runner = new BenchmarkRunner();
runner.registerTasks(DEFAULT_TASKS);
const report = await runner.runAll();
const outPath = new URL("../../benchmark-results.json", import.meta.url);
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf-8");
for (const r of report.results) {
    const detail = r.errors.length ? ` errors: ${r.errors.join("; ")}` : "";
    console.log(`  ${r.passed ? "PASS" : "FAIL"} ${r.taskId}: overall ${r.scores.overall}${detail}`);
}
console.log(`Benchmark: ${report.passedTasks}/${report.totalTasks} passed (avg overall ${report.averageScores.overall}) — benchmark-results.json written`);
//# sourceMappingURL=run.js.map