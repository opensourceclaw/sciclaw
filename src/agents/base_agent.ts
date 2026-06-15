import crypto from "crypto";
import type { AgentConfig, AgentMessage, AgentTask, AgentResult, AgentStatusInfo } from "./types.js";
import { AgentStatus, AgentRole, MessageType } from "./types.js";

const MAX_QUEUE_SIZE = 100;

export abstract class BaseAgent {
  readonly config: AgentConfig;
  private messageQueue: AgentMessage[] = [];
  private status: AgentStatus = AgentStatus.IDLE;
  private currentTaskId: string | null = null;
  private taskCount = 0;

  constructor(config: Partial<AgentConfig> & { role: AgentRole }) {
    this.config = {
      name: `${config.role.charAt(0).toUpperCase() + config.role.slice(1)}Agent`,
      capabilities: [],
      maxRetries: 3,
      timeoutMs: 60000,
      ...config,
    };
  }

  abstract execute(task: AgentTask): Promise<AgentResult>;

  sendMessage(msg: AgentMessage): void {
    if (this.messageQueue.length >= MAX_QUEUE_SIZE) {
      this.messageQueue.shift();
    }
    this.messageQueue.push(msg);
  }

  receiveMessage(): AgentMessage | null {
    return this.messageQueue.shift() ?? null;
  }

  getMessageQueueSize(): number {
    return this.messageQueue.length;
  }

  getStatus(): AgentStatusInfo {
    return {
      role: this.config.role,
      name: this.config.name,
      status: this.status,
      busy: this.status === AgentStatus.BUSY,
      queueSize: this.messageQueue.length,
      currentTask: this.currentTaskId ?? undefined,
    };
  }

  isBusy(): boolean {
    return this.status === AgentStatus.BUSY;
  }

  protected async run(task: AgentTask): Promise<AgentResult> {
    if (this.isBusy()) {
      return {
        taskId: task.id,
        role: this.config.role,
        status: "failed",
        output: null,
        artifacts: [],
        metrics: { durationMs: 0 },
        errors: ["Agent is busy"],
      };
    }

    this.status = AgentStatus.BUSY;
    this.currentTaskId = task.id;
    this.taskCount++;
    const start = Date.now();

    try {
      const result = await this.execute(task);
      this.status = AgentStatus.COMPLETED;
      result.metrics.durationMs = Date.now() - start;
      return result;
    } catch (err) {
      this.status = AgentStatus.ERROR;
      return {
        taskId: task.id,
        role: this.config.role,
        status: "failed",
        output: null,
        artifacts: [],
        metrics: { durationMs: Date.now() - start },
        errors: [(err as Error).message ?? "Unknown error"],
      };
    } finally {
      this.currentTaskId = null;
      setTimeout(() => { this.status = AgentStatus.IDLE; }, 0);
    }
  }

  protected createMessage(to: AgentRole | "orchestrator", type: MessageType, payload: unknown, taskId: string, correlationId?: string): AgentMessage {
    return {
      id: crypto.randomUUID(),
      type,
      from: this.config.role,
      to,
      taskId,
      payload,
      timestamp: new Date(),
      correlationId,
    };
  }
}
