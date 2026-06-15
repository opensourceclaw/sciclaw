import { BaseAgent } from "./base_agent.js";
import { AgentRole } from "./types.js";
const MAX_CROSS_REF_SOURCES = 20;
export class SynthesisAgent extends BaseAgent {
    constructor(config) {
        super({
            role: AgentRole.SYNTHESIS,
            name: "SynthesisAgent",
            capabilities: ["knowledge_graph", "claim_validation", "cross_referencing"],
            maxRetries: 2,
            timeoutMs: 60000,
            ...config,
        });
    }
    async execute(task) {
        const input = task.input;
        const sources = input?.sources ?? [];
        return {
            taskId: task.id,
            role: this.config.role,
            status: sources.length > 0 ? "success" : "partial",
            output: {
                knowledgeGraph: { nodes: new Map(), edges: new Map(), adjacencyList: new Map() },
                validatedClaims: [],
                riskAssessments: [],
                crossReferences: this.computeCrossReferences(sources.slice(0, MAX_CROSS_REF_SOURCES)),
                contradictions: [],
            },
            artifacts: [],
            metrics: { durationMs: 0, toolCalls: 0 },
            errors: [],
        };
    }
    computeCrossReferences(sources) {
        const refs = [];
        for (let i = 0; i < sources.length; i++) {
            for (let j = i + 1; j < sources.length; j++) {
                const agreement = this.computeAgreement(sources[i].content, sources[j].content);
                if (agreement > 0) {
                    refs.push({ sourceA: sources[i].url, sourceB: sources[j].url, agreement, contradictions: [] });
                }
            }
        }
        return refs;
    }
    computeAgreement(contentA, contentB) {
        const wordsA = new Set(contentA.toLowerCase().split(/\s+/));
        const wordsB = new Set(contentB.toLowerCase().split(/\s+/));
        if (wordsA.size === 0 || wordsB.size === 0)
            return 0;
        let intersection = 0;
        for (const w of wordsA)
            if (wordsB.has(w))
                intersection++;
        return intersection / Math.max(wordsA.size, wordsB.size);
    }
}
export function createSynthesisAgent() {
    return new SynthesisAgent();
}
//# sourceMappingURL=synthesis_agent.js.map