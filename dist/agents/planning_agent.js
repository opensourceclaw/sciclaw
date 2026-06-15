import { BaseAgent } from "./base_agent.js";
import { AgentRole } from "./types.js";
function generateQueries(topic, subtopics, strategy) {
    if (strategy === "broad") {
        const queries = [`What is ${topic}`, `${topic} overview`, `${topic} key concepts`, `${topic} applications`, `${topic} recent developments`];
        return queries.slice(0, 5);
    }
    if (strategy === "deep") {
        return subtopics.slice(0, 2).map((s) => `${s} ${topic}`);
    }
    return [`${topic} overview`, `${topic} key information`, `${topic} recent research`];
}
function extractSubtopics(topic) {
    if (!topic || topic.length === 0)
        return [];
    if (topic.length > 500)
        topic = topic.slice(0, 500);
    const words = topic.split(/\s+/);
    if (words.length <= 3)
        return [topic];
    return words.filter((w) => w.length > 4).slice(0, 4);
}
export class PlanningAgent extends BaseAgent {
    constructor(config) {
        super({
            role: AgentRole.PLANNING,
            name: "PlanningAgent",
            capabilities: ["topic_decomposition", "query_generation", "research_strategy"],
            maxRetries: 2,
            timeoutMs: 30000,
            ...config,
        });
    }
    async execute(task) {
        const input = task.input;
        const topic = input?.topic ?? "";
        if (!topic || topic.trim().length === 0) {
            return {
                taskId: task.id,
                role: this.config.role,
                status: "failed",
                output: null,
                artifacts: [],
                metrics: { durationMs: 0 },
                errors: ["Empty topic"],
            };
        }
        const subtopics = extractSubtopics(topic);
        const strategy = input?.depth ?? "balanced";
        const queries = generateQueries(topic, subtopics, strategy);
        return {
            taskId: task.id,
            role: this.config.role,
            status: "success",
            output: {
                topic,
                subtopics,
                queries,
                depth: strategy === "deep" ? 3 : strategy === "broad" ? 1 : 2,
                strategy,
                estimatedPhaseCount: 4,
            },
            artifacts: [],
            metrics: { durationMs: 0, toolCalls: 0 },
            errors: [],
        };
    }
}
export function createPlanningAgent() {
    return new PlanningAgent();
}
//# sourceMappingURL=planning_agent.js.map