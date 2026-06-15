export declare enum AgentRole {
    PLANNING = "planning",
    SEARCH = "search",
    SYNTHESIS = "synthesis",
    WRITING = "writing"
}
export declare enum MessageType {
    TASK = "task",
    RESULT = "result",
    QUERY = "query",
    ERROR = "error",
    STATUS = "status"
}
export declare enum AgentStatus {
    IDLE = "idle",
    BUSY = "busy",
    ERROR = "error",
    COMPLETED = "completed"
}
export interface AgentConfig {
    role: AgentRole;
    name: string;
    capabilities: string[];
    maxRetries: number;
    timeoutMs: number;
}
export interface AgentMessage {
    id: string;
    type: MessageType;
    from: AgentRole;
    to: AgentRole | "orchestrator";
    taskId: string;
    payload: unknown;
    timestamp: Date;
    correlationId?: string;
}
export interface AgentTask {
    id: string;
    role: AgentRole;
    action: string;
    input: unknown;
    context?: Record<string, unknown>;
    priority: number;
    deadline?: Date;
}
export interface AgentResult {
    taskId: string;
    role: AgentRole;
    status: "success" | "partial" | "failed";
    output: unknown;
    artifacts: string[];
    metrics: {
        durationMs: number;
        tokenCount?: number;
        toolCalls?: number;
    };
    errors: string[];
}
export interface OrchestrationPlan {
    id: string;
    topic: string;
    phases: OrchestrationPhase[];
    createdAt: Date;
}
export interface OrchestrationPhase {
    order: number;
    name: string;
    agents: AgentRole[];
    dependencies: number[];
    timeoutMs: number;
}
export interface PhaseResult {
    order: number;
    name: string;
    results: AgentResult[];
    durationMs: number;
    status: "success" | "partial" | "failed";
}
export interface OrchestrationResult {
    planId: string;
    topic: string;
    phases: PhaseResult[];
    aggregatedOutput: unknown;
    totalDurationMs: number;
    overallStatus: "success" | "partial" | "failed";
}
export interface AgentStatusInfo {
    role: AgentRole;
    name: string;
    status: AgentStatus;
    busy: boolean;
    queueSize: number;
    currentTask?: string;
}
//# sourceMappingURL=types.d.ts.map