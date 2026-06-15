import { BaseAgent } from "./base_agent.js";
import type { AgentConfig, AgentTask, AgentResult } from "./types.js";
import { AgentRole } from "./types.js";
export declare class PlanningAgent extends BaseAgent {
    constructor(config?: Partial<AgentConfig> & {
        role: AgentRole;
    });
    execute(task: AgentTask): Promise<AgentResult>;
}
export declare function createPlanningAgent(): PlanningAgent;
//# sourceMappingURL=planning_agent.d.ts.map