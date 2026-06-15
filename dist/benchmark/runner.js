import { Orchestrator } from "../agents/orchestrator.js";
import { PlanningAgent } from "../agents/planning_agent.js";
import { SearchAgent } from "../agents/search_agent.js";
import { SynthesisAgent } from "../agents/synthesis_agent.js";
import { WritingAgent } from "../agents/writing_agent.js";
import { computeFactuality, computeCompleteness, computeCitationQuality, computeReasoningDepth, computeOverall } from "./metrics.js";
export class BenchmarkRunner {
    tasks = new Map();
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
            const orchestrator = new Orchestrator();
            orchestrator.registerAgent(new PlanningAgent());
            orchestrator.registerAgent(new SearchAgent());
            orchestrator.registerAgent(new SynthesisAgent());
            orchestrator.registerAgent(new WritingAgent());
            const plan = orchestrator.createPlan(task.input.topic);
            const result = await orchestrator.executePlan(plan);
            const durationMs = Date.now() - start;
            const scores = this.computeScores(task, result);
            const passed = scores.overall >= task.scoring.threshold;
            return {
                taskId: task.id,
                taskName: task.name,
                category: task.category,
                scores,
                metrics: {
                    durationMs,
                    tokenCount: 0,
                    sourceCount: 0,
                    claimCount: 0,
                },
                passed,
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
    computeScores(task, _orchestrationResult) {
        const factuality = computeFactuality([], task.input.expectedFacts);
        const completeness = computeCompleteness([], 4, task.input.expectedSources, task.input.minSections);
        const citation = computeCitationQuality([]);
        const reasoning = computeReasoningDepth(0, 0);
        const overall = computeOverall({ factuality, completeness, citation, reasoning }, {
            factuality: task.scoring.factualityWeight,
            completeness: task.scoring.completenessWeight,
            citation: task.scoring.citationWeight,
            reasoning: task.scoring.reasoningWeight,
        });
        return { factuality, completeness, citation, reasoning, overall };
    }
    buildReport(results) {
        const totalTasks = results.length;
        const passedTasks = results.filter((r) => r.passed).length;
        const avg = (key) => {
            if (totalTasks === 0)
                return 0;
            return Math.round((results.reduce((s, r) => s + r.scores[key], 0) / totalTasks) * 1000) / 1000;
        };
        const categories = ["factuality", "completeness", "citation", "reasoning", "multi_agent"];
        const categoryBreakdown = {};
        for (const cat of categories) {
            const catResults = results.filter((r) => r.category === cat);
            categoryBreakdown[cat] = {
                count: catResults.length,
                passed: catResults.filter((r) => r.passed).length,
                avgScore: catResults.length > 0
                    ? Math.round((catResults.reduce((s, r) => s + r.scores.overall, 0) / catResults.length) * 1000) / 1000
                    : 0,
            };
        }
        return {
            timestamp: new Date(),
            version: "2.0.0-rc.3",
            totalTasks,
            passedTasks,
            passRate: totalTasks > 0 ? Math.round((passedTasks / totalTasks) * 1000) / 1000 : 0,
            averageScores: {
                factuality: avg("factuality"),
                completeness: avg("completeness"),
                citation: avg("citation"),
                reasoning: avg("reasoning"),
                overall: avg("overall"),
            },
            categoryBreakdown,
            results,
        };
    }
}
//# sourceMappingURL=runner.js.map