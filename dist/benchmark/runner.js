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
// SciClaw v4.0.0 — GA-A3: the benchmark runs the REAL research pipeline (flows in
// src/flows) and scores its actual outputs (claims / verification / sources /
// report). The previous version ignored the orchestration result entirely and fed
// empty arrays into every metric — structural zeros (Edith G3).
import { readFileSync } from "node:fs";
import { DeepResearchFlow } from "../flows/deep_research_flow.js";
import { extractClaims, verifyClaim } from "../core/index.js";
import { computeFactuality, computeCompleteness, computeCitationQuality, computeReasoningDepth, computeOverall } from "./metrics.js";
import { generateReport } from "./reporter.js";
function packageVersion() {
    try {
        const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf-8"));
        return pkg.version ?? "0.0.0";
    }
    catch {
        return "0.0.0";
    }
}
export class BenchmarkRunner {
    tasks = new Map();
    mock;
    constructor(opts = {}) {
        this.mock = opts.mock ?? false;
    }
    registerTask(task) {
        this.tasks.set(task.id, task);
    }
    registerTasks(tasks) {
        for (const task of tasks)
            this.registerTask(task);
    }
    unregisterTask(taskId) {
        return this.tasks.delete(taskId);
    }
    getRegisteredTasks() {
        return [...this.tasks.values()];
    }
    getRegisteredCategories() {
        return [...new Set([...this.tasks.values()].map((t) => t.category))];
    }
    async runAll() {
        const results = [];
        for (const task of this.tasks.values()) {
            results.push(await this.runTask(task.id));
        }
        return this.buildReport(results);
    }
    async runCategory(category) {
        const results = [];
        for (const task of this.tasks.values()) {
            if (task.category === category) {
                results.push(await this.runTask(task.id));
            }
        }
        return this.buildReport(results);
    }
    async runTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task)
            throw new Error(`Task not found: ${taskId}`);
        const start = Date.now();
        try {
            const flow = new DeepResearchFlow(undefined, { approvalRequired: false, mock: this.mock });
            await flow.start(task.input.topic);
            await flow.plan();
            const sets = await flow.search();
            await flow.analyze();
            await flow.synthesize();
            const report = await flow.report();
            const bundle = await this.buildExecutionBundle(sets.flatMap((s) => s.results), report.references, report.sections.length, sets.length, Date.now() - start);
            const scores = this.computeScores(task, bundle);
            return {
                taskId,
                taskName: task.name,
                category: task.category,
                scores,
                metrics: {
                    durationMs: bundle.durationMs,
                    tokenCount: 0,
                    sourceCount: bundle.sources.length,
                    claimCount: bundle.claims.length,
                },
                passed: scores.overall >= task.scoring.threshold,
                errors: [],
            };
        }
        catch (err) {
            return {
                taskId,
                taskName: task.name,
                category: task.category,
                scores: { factuality: 0, completeness: 0, citation: 0, reasoning: 0, overall: 0 },
                metrics: { durationMs: Date.now() - start, tokenCount: 0, sourceCount: 0, claimCount: 0 },
                passed: false,
                errors: [err.message],
            };
        }
    }
    /**
     * Collect real evidence from the run: deterministic claim extraction over the
     * collected snippets and verification against the collected evidence corpus
     * (FactCheckService compares claims against source TEXTS, not URLs).
     */
    async buildExecutionBundle(results, references, sections, subQuerySets, durationMs) {
        const claims = [];
        for (const r of results) {
            if (!r.snippet)
                continue;
            claims.push(...extractClaims(r.snippet, r.url, r.title));
        }
        const evidenceCorpus = results.map((r) => r.snippet).filter((s) => Boolean(s));
        const verified = await Promise.all(claims.map((c) => verifyClaim(c, evidenceCorpus)));
        const citations = references.map((url) => ({ url }));
        return { claims, verified, sources: references, sections, citations, subQuerySets, durationMs };
    }
    /** Scores computed from the real execution bundle — no empty-array placeholders. */
    computeScores(task, bundle) {
        const factuality = computeFactuality(bundle.verified, task.input.expectedFacts);
        const completeness = computeCompleteness(bundle.sources, bundle.sections, task.input.expectedSources, task.input.minSections);
        const citation = computeCitationQuality(bundle.citations);
        const reasoning = computeReasoningDepth(bundle.subQuerySets, bundle.citations.length);
        const overall = computeOverall({ factuality, completeness, citation, reasoning }, {
            factuality: task.scoring.factualityWeight,
            completeness: task.scoring.completenessWeight,
            citation: task.scoring.citationWeight,
            reasoning: task.scoring.reasoningWeight,
        });
        return { factuality, completeness, citation, reasoning, overall };
    }
    buildReport(results) {
        return generateReport(results, packageVersion());
    }
}
//# sourceMappingURL=runner.js.map