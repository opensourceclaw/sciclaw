import type { AgentConfig, AgentMessage, AgentTask, AgentResult, AgentStatusInfo } from "./types.js";
import { AgentRole, MessageType } from "./types.js";
export declare abstract class BaseAgent {
    readonly config: AgentConfig;
    private messageQueue;
    private status;
    private currentTaskId;
    private taskCount;
    constructor(config: Partial<AgentConfig> & {
        role: AgentRole;
    });
    abstract execute(task: AgentTask): Promise<AgentResult>;
    sendMessage(msg: AgentMessage): void;
    receiveMessage(): AgentMessage | null;
    getMessageQueueSize(): number;
    getStatus(): AgentStatusInfo;
    isBusy(): boolean;
    protected run(task: AgentTask): Promise<AgentResult>;
    protected createMessage(to: AgentRole | "orchestrator", type: MessageType, payload: unknown, taskId: string, correlationId?: string): AgentMessage;
}
//# sourceMappingURL=base_agent.d.ts.map