import { BaseAgent } from "./base_agent.js";
import type { AgentConfig, AgentTask, AgentResult } from "./types.js";
import { AgentRole } from "./types.js";
export declare class SynthesisAgent extends BaseAgent {
    constructor(config?: Partial<AgentConfig> & {
        role: AgentRole;
    });
    execute(task: AgentTask): Promise<AgentResult>;
    private computeCrossReferences;
    private computeAgreement;
}
export declare function createSynthesisAgent(): SynthesisAgent;
//# sourceMappingURL=synthesis_agent.d.ts.map