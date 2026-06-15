import crypto from "crypto";
import { AgentStatus } from "./types.js";
const MAX_QUEUE_SIZE = 100;
export class BaseAgent {
    config;
    messageQueue = [];
    status = AgentStatus.IDLE;
    currentTaskId = null;
    taskCount = 0;
    constructor(config) {
        this.config = {
            name: `${config.role.charAt(0).toUpperCase() + config.role.slice(1)}Agent`,
            capabilities: [],
            maxRetries: 3,
            timeoutMs: 60000,
            ...config,
        };
    }
    sendMessage(msg) {
        if (this.messageQueue.length >= MAX_QUEUE_SIZE) {
            this.messageQueue.shift();
        }
        this.messageQueue.push(msg);
    }
    receiveMessage() {
        return this.messageQueue.shift() ?? null;
    }
    getMessageQueueSize() {
        return this.messageQueue.length;
    }
    getStatus() {
        return {
            role: this.config.role,
            name: this.config.name,
            status: this.status,
            busy: this.status === AgentStatus.BUSY,
            queueSize: this.messageQueue.length,
            currentTask: this.currentTaskId ?? undefined,
        };
    }
    isBusy() {
        return this.status === AgentStatus.BUSY;
    }
    async run(task) {
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
        }
        catch (err) {
            this.status = AgentStatus.ERROR;
            return {
                taskId: task.id,
                role: this.config.role,
                status: "failed",
                output: null,
                artifacts: [],
                metrics: { durationMs: Date.now() - start },
                errors: [err.message ?? "Unknown error"],
            };
        }
        finally {
            this.currentTaskId = null;
            setTimeout(() => { this.status = AgentStatus.IDLE; }, 0);
        }
    }
    createMessage(to, type, payload, taskId, correlationId) {
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
//# sourceMappingURL=base_agent.js.map