/**
 * SciClaw v3.0.0 — Reasoning Chain Manager
 *
 * Multi-step reasoning chain with chain-of-thought support.
 * Supports ≥5 step reasoning chains with topological ordering and validation.
 */
import { ReasoningStepType, DEFAULT_REASONING_CONFIG, } from "./types.js";
// ── Helpers ──────────────────────────────────────────────────────────────
function generateId() {
    return crypto.randomUUID();
}
function hasCycle(steps) {
    const stepMap = new Map(steps.map((s) => [s.id, s]));
    const visited = new Set();
    const inStack = new Set();
    function dfs(stepId) {
        if (inStack.has(stepId))
            return true;
        if (visited.has(stepId))
            return false;
        visited.add(stepId);
        inStack.add(stepId);
        const step = stepMap.get(stepId);
        if (step) {
            for (const depId of step.dependsOn) {
                if (dfs(depId))
                    return true;
            }
        }
        inStack.delete(stepId);
        return false;
    }
    for (const step of steps) {
        if (dfs(step.id))
            return true;
    }
    return false;
}
function topologicalSort(steps) {
    const stepMap = new Map(steps.map((s) => [s.id, s]));
    const inDegree = new Map();
    const adjacency = new Map();
    for (const step of steps) {
        inDegree.set(step.id, step.dependsOn.length);
        adjacency.set(step.id, []);
    }
    for (const step of steps) {
        for (const depId of step.dependsOn) {
            const neighbors = adjacency.get(depId);
            if (neighbors)
                neighbors.push(step.id);
        }
    }
    const queue = [];
    for (const [id, degree] of inDegree) {
        if (degree === 0)
            queue.push(id);
    }
    const sorted = [];
    while (queue.length > 0) {
        const id = queue.shift();
        sorted.push(stepMap.get(id));
        for (const neighbor of adjacency.get(id) ?? []) {
            const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
            inDegree.set(neighbor, newDegree);
            if (newDegree === 0)
                queue.push(neighbor);
        }
    }
    return sorted;
}
function computeStepConfidence(step, dependencySteps, config) {
    const evidenceScore = Math.min(step.evidence.length * 0.15, 0.9);
    const depScore = dependencySteps.length > 0
        ? (dependencySteps.reduce((s, d) => s + d.confidence, 0) /
            dependencySteps.length) *
            0.3
        : 0;
    return Math.max(Math.min(evidenceScore + depScore, 1.0), config.minConfidence);
}
// ── ReasoningChainManager ────────────────────────────────────────────────
export class ReasoningChainManager {
    config;
    constructor(config) {
        this.config = { ...DEFAULT_REASONING_CONFIG, ...config };
        if (this.config.maxSteps < 3)
            this.config.maxSteps = 3;
        if (this.config.maxSteps > 20)
            this.config.maxSteps = 20;
        if (this.config.minConfidence < 0.1)
            this.config.minConfidence = 0.1;
        if (this.config.minConfidence > 0.9)
            this.config.minConfidence = 0.9;
    }
    createChain(topic, goal) {
        return {
            id: generateId(),
            topic,
            goal,
            steps: [],
            maxSteps: this.config.maxSteps,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
    addStep(chain, step) {
        if (chain.steps.length >= chain.maxSteps) {
            throw new Error(`Max steps (${chain.maxSteps}) exceeded for chain ${chain.id}`);
        }
        const newStep = {
            ...step,
            id: generateId(),
            timestamp: new Date(),
        };
        return {
            ...chain,
            steps: [...chain.steps, newStep],
            updatedAt: new Date(),
        };
    }
    validateChain(chain) {
        const errors = [];
        if (chain.steps.length < 5) {
            errors.push(`Chain must have at least 5 steps, got ${chain.steps.length}`);
        }
        if (!chain.steps.some((s) => s.type === ReasoningStepType.OBSERVATION)) {
            errors.push("Chain must contain at least one OBSERVATION step");
        }
        if (!chain.steps.some((s) => s.type === ReasoningStepType.CONCLUSION)) {
            errors.push("Chain must contain at least one CONCLUSION step");
        }
        const lastStep = chain.steps[chain.steps.length - 1];
        if (lastStep && lastStep.type !== ReasoningStepType.CONCLUSION) {
            errors.push("Last step must be of type CONCLUSION");
        }
        if (hasCycle(chain.steps)) {
            errors.push("Chain contains circular dependencies");
        }
        const stepIds = new Set(chain.steps.map((s) => s.id));
        for (const step of chain.steps) {
            for (const depId of step.dependsOn) {
                if (!stepIds.has(depId)) {
                    errors.push(`Step ${step.id} depends on unknown step ${depId}`);
                }
            }
        }
        return { valid: errors.length === 0, errors };
    }
    executeChain(chain, context) {
        const startTime = Date.now();
        const validation = this.validateChain(chain);
        if (!validation.valid) {
            return {
                chainId: chain.id,
                conclusion: "",
                confidence: 0,
                steps: chain.steps,
                durationMs: Date.now() - startTime,
                alternativeConclusions: [],
            };
        }
        // Topological sort
        const sorted = topologicalSort(chain.steps);
        const stepMap = new Map(sorted.map((s) => [s.id, s]));
        // Compute confidence for each step
        const computedSteps = sorted.map((step) => {
            const depSteps = step.dependsOn
                .map((id) => stepMap.get(id))
                .filter((s) => s !== undefined);
            const confidence = computeStepConfidence(step, depSteps, this.config);
            return { ...step, confidence };
        });
        // Find conclusion step
        const conclusionStep = computedSteps.find((s) => s.type === ReasoningStepType.CONCLUSION);
        // Collect alternative conclusions (HYPOTHESIS and other CONCLUSION steps)
        const alternativeConclusions = computedSteps
            .filter((s) => s.type === ReasoningStepType.HYPOTHESIS ||
            (s.type === ReasoningStepType.CONCLUSION &&
                s.id !== conclusionStep?.id))
            .slice(0, this.config.maxAlternatives)
            .map((s) => s.statement);
        // Overall confidence: weighted average of all steps
        const overallConfidence = computedSteps.length > 0
            ? computedSteps.reduce((sum, s) => sum + s.confidence, 0) /
                computedSteps.length
            : 0;
        return {
            chainId: chain.id,
            conclusion: conclusionStep?.statement ?? "",
            confidence: Math.round(overallConfidence * 100) / 100,
            steps: computedSteps,
            durationMs: Date.now() - startTime,
            alternativeConclusions,
        };
    }
    getStepCount(chain) {
        return chain.steps.length;
    }
    getAverageConfidence(chain) {
        if (chain.steps.length === 0)
            return 0;
        const sum = chain.steps.reduce((s, step) => s + step.confidence, 0);
        return Math.round((sum / chain.steps.length) * 100) / 100;
    }
    getChainSummary(chain) {
        const parts = [
            `Reasoning chain for "${chain.topic}"`,
            `Goal: ${chain.goal}`,
            `${chain.steps.length} steps`,
        ];
        for (const step of chain.steps) {
            const summary = step.statement.length > 100
                ? step.statement.slice(0, 97) + "..."
                : step.statement;
            parts.push(`  [${step.type}] ${summary}`);
        }
        return parts.join("\n");
    }
    exportChain(chain) {
        return [...chain.steps];
    }
}
export function createReasoningChainManager(config) {
    return new ReasoningChainManager(config);
}
//# sourceMappingURL=chain.js.map