import { BaseAgent } from "./base_agent.js";
import type { AgentConfig, AgentTask, AgentResult } from "./types.js";
import { AgentRole } from "./types.js";
export declare class SearchAgent extends BaseAgent {
    constructor(config?: Partial<AgentConfig> & {
        role: AgentRole;
    });
    execute(task: AgentTask): Promise<AgentResult>;
}
export declare function createSearchAgent(): SearchAgent;
//# sourceMappingURL=search_agent.d.ts.map