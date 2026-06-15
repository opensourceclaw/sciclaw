import { BaseAgent } from "./base_agent.js";
import type { AgentMessage, OrchestrationPlan, OrchestrationPhase, OrchestrationResult, AgentStatusInfo } from "./types.js";
import { AgentRole, MessageType } from "./types.js";
export declare class Orchestrator {
    private agents;
    private executing;
    registerAgent(agent: BaseAgent): void;
    unregisterAgent(role: AgentRole): boolean;
    getAgent(role: AgentRole): BaseAgent | undefined;
    createPlan(topic: string, options?: {
        phases?: OrchestrationPhase[];
        timeoutMs?: number;
    }): OrchestrationPlan;
    executePlan(plan: OrchestrationPlan): Promise<OrchestrationResult>;
    sendMessage(msg: AgentMessage): void;
    broadcast(type: MessageType, payload: unknown): void;
    getAgentStatuses(): Map<AgentRole, AgentStatusInfo>;
    isAnyAgentBusy(): boolean;
    private dispatchTask;
    private aggregateResults;
}
//# sourceMappingURL=orchestrator.d.ts.map