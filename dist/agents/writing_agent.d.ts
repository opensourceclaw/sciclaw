import { BaseAgent } from "./base_agent.js";
import type { AgentConfig, AgentTask, AgentResult } from "./types.js";
import { AgentRole } from "./types.js";
export declare class WritingAgent extends BaseAgent {
    constructor(config?: Partial<AgentConfig> & {
        role: AgentRole;
    });
    execute(task: AgentTask): Promise<AgentResult>;
    private buildReport;
}
export declare function createWritingAgent(): WritingAgent;
//# sourceMappingURL=writing_agent.d.ts.map