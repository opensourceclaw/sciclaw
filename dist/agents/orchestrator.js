import crypto from "crypto";
import { AgentRole } from "./types.js";
const DEFAULT_PHASES = [
    { order: 1, name: "Plan", agents: [AgentRole.PLANNING], dependencies: [], timeoutMs: 30000 },
    { order: 2, name: "Search", agents: [AgentRole.SEARCH], dependencies: [1], timeoutMs: 60000 },
    { order: 3, name: "Synthesize", agents: [AgentRole.SYNTHESIS], dependencies: [2], timeoutMs: 60000 },
    { order: 4, name: "Write", agents: [AgentRole.WRITING], dependencies: [3], timeoutMs: 60000 },
];
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export class Orchestrator {
    agents = new Map();
    executing = false;
    registerAgent(agent) {
        this.agents.set(agent.config.role, agent);
    }
    unregisterAgent(role) {
        return this.agents.delete(role);
    }
    getAgent(role) {
        return this.agents.get(role);
    }
    createPlan(topic, options) {
        const phases = options?.phases ?? DEFAULT_PHASES.map((p) => ({ ...p, timeoutMs: options?.timeoutMs ?? p.timeoutMs }));
        return { id: crypto.randomUUID(), topic, phases, createdAt: new Date() };
    }
    async executePlan(plan) {
        if (this.executing) {
            throw new Error("Orchestrator is already executing a plan");
        }
        this.executing = true;
        const start = Date.now();
        try {
            const missing = plan.phases.flatMap((p) => p.agents).filter((r) => !this.agents.has(r));
            if (missing.length > 0) {
                throw new Error(`Missing agents for roles: ${[...new Set(missing)].join(", ")}`);
            }
            const phaseResults = [];
            const completedPhases = new Set();
            for (const phase of plan.phases) {
                const depsMet = phase.dependencies.every((d) => completedPhases.has(d));
                if (!depsMet) {
                    phaseResults.push({
                        order: phase.order,
                        name: phase.name,
                        results: [],
                        durationMs: 0,
                        status: "failed",
                    });
                    continue;
                }
                const phaseStart = Date.now();
                const results = await Promise.all(phase.agents.map((role) => this.dispatchTask(this.agents.get(role), phase, plan)));
                const phaseStatus = results.every((r) => r.status === "success")
                    ? "success"
                    : results.some((r) => r.status === "success" || r.status === "partial")
                        ? "partial"
                        : "failed";
                phaseResults.push({
                    order: phase.order,
                    name: phase.name,
                    results,
                    durationMs: Date.now() - phaseStart,
                    status: phaseStatus,
                });
                completedPhases.add(phase.order);
            }
            const overallStatus = phaseResults.every((p) => p.status === "success")
                ? "success"
                : phaseResults.some((p) => p.status === "success" || p.status === "partial")
                    ? "partial"
                    : "failed";
            return {
                planId: plan.id,
                topic: plan.topic,
                phases: phaseResults,
                aggregatedOutput: this.aggregateResults(phaseResults),
                totalDurationMs: Date.now() - start,
                overallStatus,
            };
        }
        finally {
            this.executing = false;
        }
    }
    sendMessage(msg) {
        const target = msg.to === "orchestrator" ? undefined : this.agents.get(msg.to);
        if (target)
            target.sendMessage(msg);
    }
    broadcast(type, payload) {
        for (const agent of this.agents.values()) {
            agent.sendMessage({
                id: crypto.randomUUID(),
                type,
                from: "orchestrator",
                to: agent.config.role,
                taskId: "",
                payload,
                timestamp: new Date(),
            });
        }
    }
    getAgentStatuses() {
        const map = new Map();
        for (const [role, agent] of this.agents) {
            map.set(role, agent.getStatus());
        }
        return map;
    }
    isAnyAgentBusy() {
        return [...this.agents.values()].some((a) => a.isBusy());
    }
    async dispatchTask(agent, phase, plan) {
        const task = {
            id: crypto.randomUUID(),
            role: agent.config.role,
            action: phase.name.toLowerCase(),
            input: { topic: plan.topic, phase: phase.order },
            priority: 5,
        };
        let lastError;
        for (let attempt = 0; attempt <= agent.config.maxRetries; attempt++) {
            try {
                const result = await Promise.race([
                    agent.execute(task),
                    new Promise((_, reject) => setTimeout(() => reject(new Error(`Agent timeout after ${phase.timeoutMs}ms`)), phase.timeoutMs)),
                ]);
                return result;
            }
            catch (err) {
                lastError = err;
                if (attempt < agent.config.maxRetries) {
                    await sleep(1000 * (attempt + 1));
                }
            }
        }
        return {
            taskId: task.id,
            role: agent.config.role,
            status: "failed",
            output: null,
            artifacts: [],
            metrics: { durationMs: 0 },
            errors: [lastError?.message ?? "Unknown error"],
        };
    }
    aggregateResults(phases) {
        const outputs = {};
        for (const phase of phases) {
            for (const result of phase.results) {
                if (result.status !== "failed" && result.output) {
                    outputs[result.role] = result.output;
                }
            }
        }
        return outputs;
    }
}
//# sourceMappingURL=orchestrator.js.map