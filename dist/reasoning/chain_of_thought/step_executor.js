/**
 * Step Executor - Executes reasoning steps according to dependency order
 *
 * Uses DAG-based scheduling: steps without dependencies run in parallel,
 * sequential chains run in order. Supports retry and timeout per step.
 */
import { StepStatus, } from './types.js';
const DEFAULT_CONFIG = {
    maxDepth: 5,
    maxSteps: 20,
    retryCount: 3,
    timeoutMs: 30000,
};
export class StepExecutor {
    llmEngine;
    config;
    cache = new Map();
    constructor(llmEngine, config) {
        this.llmEngine = llmEngine;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    async execute(steps) {
        if (steps.length === 0)
            return [];
        // Validate for cycles
        this.detectCycle(steps);
        const results = [];
        const nodes = this.buildGraph(steps);
        const completed = new Set();
        const failed = new Set();
        // Process in topological order
        while (completed.size + failed.size < steps.length) {
            // Find ready steps (all dependencies met)
            const ready = Array.from(nodes.values())
                .filter((n) => !completed.has(n.step.id) && !failed.has(n.step.id))
                .filter((n) => {
                for (const depId of n.step.dependencies) {
                    if (!completed.has(depId) && !depId.startsWith('auto_')) {
                        // Check if this dep is a step id
                        if (nodes.has(depId) && !completed.has(depId))
                            return false;
                    }
                }
                return true;
            });
            if (ready.length === 0) {
                // Skip remaining unreachable steps
                for (const n of nodes.values()) {
                    if (!completed.has(n.step.id) && !failed.has(n.step.id)) {
                        failed.add(n.step.id);
                        results.push(this.makeFailedResult(n.step, 'Dependency failed'));
                    }
                }
                break;
            }
            // Execute ready steps in parallel
            const batchResults = await Promise.all(ready.map((n) => this.executeStep(n.step)));
            for (const r of batchResults) {
                results.push(r);
                if (r.step.status === StepStatus.COMPLETED) {
                    completed.add(r.step.id);
                }
                else {
                    failed.add(r.step.id);
                }
            }
        }
        // Sort by stepNumber
        results.sort((a, b) => a.step.stepNumber - b.step.stepNumber);
        return results;
    }
    async executeStep(step) {
        // Check cache
        const cacheKey = `${step.strategy}:${step.subQuestion}`;
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return { ...cached, step: { ...cached.step, id: step.id, stepNumber: step.stepNumber } };
        }
        const startTime = Date.now();
        let lastError;
        for (let attempt = 0; attempt <= this.config.retryCount; attempt++) {
            try {
                const response = await this.llmEngine.chatSimple(`Reason step: ${step.subQuestion}`, { temperature: 0.3, maxTokens: 500 });
                const result = {
                    step: { ...step, status: StepStatus.COMPLETED },
                    reasoning: response,
                    result: response,
                    confidence: 0.7,
                    sources: [],
                    durationMs: Date.now() - startTime,
                };
                this.cache.set(cacheKey, result);
                return result;
            }
            catch (err) {
                lastError = err instanceof Error ? err.message : String(err);
                if (attempt < this.config.retryCount) {
                    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
                }
            }
        }
        return this.makeFailedResult(step, lastError ?? 'Unknown error', Date.now() - startTime);
    }
    makeFailedResult(step, error, durationMs = 0) {
        return {
            step: { ...step, status: StepStatus.FAILED },
            reasoning: '',
            result: null,
            confidence: 0,
            sources: [],
            durationMs,
            error,
        };
    }
    buildGraph(steps) {
        const nodes = new Map();
        for (const step of steps) {
            const deps = new Set(step.dependencies.filter((d) => steps.some((s) => s.id === d)));
            nodes.set(step.id, {
                step,
                inDegree: deps.size,
                dependsOn: deps,
            });
        }
        return nodes;
    }
    detectCycle(steps) {
        const visited = new Set();
        const inStack = new Set();
        const dfs = (id) => {
            if (inStack.has(id))
                return true;
            if (visited.has(id))
                return false;
            visited.add(id);
            inStack.add(id);
            const step = steps.find((s) => s.id === id);
            if (step) {
                for (const depId of step.dependencies) {
                    if (steps.some((s) => s.id === depId)) {
                        if (dfs(depId))
                            return true;
                    }
                }
            }
            inStack.delete(id);
            return false;
        };
        for (const step of steps) {
            if (dfs(step.id)) {
                throw new Error(`Circular dependency detected involving step: ${step.subQuestion}`);
            }
        }
    }
}
//# sourceMappingURL=step_executor.js.map