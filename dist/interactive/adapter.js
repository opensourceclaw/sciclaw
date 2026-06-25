/**
 * DeepClaw v3.0.0 — Human-in-the-Loop Adapter
 *
 * Session management and user interaction processing.
 */
import { SessionStatus, FeedbackAction, DEFAULT_INTERACTIVE_CONFIG, } from "./types.js";
// ── Helpers ──────────────────────────────────────────────────────────────
function generateId() {
    return crypto.randomUUID();
}
function createDefaultContext(topic) {
    return {
        topic,
        depth: 0,
        focus: [topic],
        exploredTopics: [],
        excludedTopics: [],
        preferences: [],
        confidence: 0.5,
    };
}
function applyActionToContext(action, content, context) {
    switch (action) {
        case FeedbackAction.ACCEPT:
            return {
                ...context,
                confidence: Math.min(context.confidence + 0.1, 1.0),
            };
        case FeedbackAction.REJECT:
            return {
                ...context,
                excludedTopics: [...context.excludedTopics, content],
                confidence: Math.max(context.confidence - 0.15, 0.1),
            };
        case FeedbackAction.REFINE:
            return {
                ...context,
                depth: context.depth + 1,
                focus: [...context.focus, content],
            };
        case FeedbackAction.REDIRECT:
            return {
                ...context,
                focus: [content],
                exploredTopics: [...context.exploredTopics, ...context.focus],
                confidence: 0.5,
            };
        case FeedbackAction.MODIFY:
            return {
                ...context,
                focus: context.focus.map((f) => f === context.focus[0] ? content : f),
            };
        default:
            return context;
    }
}
// ── HumanInLoopAdapter ───────────────────────────────────────────────────
export class HumanInLoopAdapter {
    config;
    sessions = new Map();
    constructor(config) {
        this.config = { ...DEFAULT_INTERACTIVE_CONFIG, ...config };
        if (this.config.sessionTimeoutMs < 60000)
            this.config.sessionTimeoutMs = 60000;
        if (this.config.sessionTimeoutMs > 3600000)
            this.config.sessionTimeoutMs = 3600000;
        if (this.config.maxTurns < 5)
            this.config.maxTurns = 5;
        if (this.config.maxTurns > 200)
            this.config.maxTurns = 200;
    }
    startSession(topic, userId, mode) {
        if (!topic)
            throw new Error("Topic is required");
        const session = {
            id: generateId(),
            topic,
            userId: userId || `anon-${generateId().slice(0, 8)}`,
            mode: mode ?? this.config.mode,
            status: SessionStatus.ACTIVE,
            history: [],
            context: createDefaultContext(topic),
            createdAt: new Date(),
            updatedAt: new Date(),
            expiresAt: new Date(Date.now() + this.config.sessionTimeoutMs),
        };
        this.sessions.set(session.id, session);
        return session;
    }
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session && new Date() > session.expiresAt) {
            session.status = SessionStatus.EXPIRED;
        }
        return session;
    }
    endSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            throw new Error(`Session not found: ${sessionId}`);
        session.status = SessionStatus.COMPLETED;
        session.updatedAt = new Date();
        return session;
    }
    pauseSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            throw new Error(`Session not found: ${sessionId}`);
        session.status = SessionStatus.PAUSED;
        session.updatedAt = new Date();
        return session;
    }
    resumeSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            throw new Error(`Session not found: ${sessionId}`);
        session.status = SessionStatus.ACTIVE;
        session.updatedAt = new Date();
        return session;
    }
    processInput(sessionId, input) {
        const session = this.sessions.get(sessionId);
        if (!session)
            throw new Error(`Session not found: ${sessionId}`);
        if (session.status === SessionStatus.EXPIRED)
            throw new Error("Session expired");
        if (session.status === SessionStatus.PAUSED)
            throw new Error("Session is paused");
        if (session.status === SessionStatus.COMPLETED)
            throw new Error("Session is completed");
        const startTime = Date.now();
        // Update context based on action
        session.context = applyActionToContext(input.action, input.content, session.context);
        // Create turn
        const turn = {
            id: generateId(),
            turnNumber: session.history.length + 1,
            userInput: input,
            timestamp: new Date(),
            latencyMs: Date.now() - startTime,
        };
        session.history.push(turn);
        // Check max turns
        if (session.history.length >= this.config.maxTurns) {
            session.status = SessionStatus.COMPLETED;
        }
        else {
            session.status = SessionStatus.WAITING_USER;
        }
        session.updatedAt = new Date();
        // Generate suggestions
        const suggestions = [];
        if (session.context.confidence < 0.4) {
            suggestions.push("Consider refining the research direction");
        }
        if (session.context.focus.length === 0) {
            suggestions.push("No active focus areas; provide a new direction");
        }
        if (session.context.depth > 3) {
            suggestions.push("Research is deep; consider validating findings");
        }
        return {
            sessionId,
            phase: "response",
            summary: `Processed ${input.action} on "${input.content.slice(0, 50)}"`,
            suggestions,
        };
    }
    requestUserInput(sessionId, message) {
        const session = this.sessions.get(sessionId);
        if (!session)
            throw new Error(`Session not found: ${sessionId}`);
        const turn = {
            id: generateId(),
            turnNumber: session.history.length + 1,
            systemMessage: message,
            timestamp: new Date(),
            latencyMs: 0,
        };
        session.history.push(turn);
        session.status = SessionStatus.WAITING_USER;
        session.updatedAt = new Date();
        return session;
    }
    updateContext(sessionId, updates) {
        const session = this.sessions.get(sessionId);
        if (!session)
            throw new Error(`Session not found: ${sessionId}`);
        session.context = { ...session.context, ...updates };
        session.updatedAt = new Date();
        return session.context;
    }
    getContext(sessionId) {
        return this.sessions.get(sessionId)?.context;
    }
    getActiveSessions() {
        return [...this.sessions.values()].filter((s) => s.status === SessionStatus.ACTIVE || s.status === SessionStatus.WAITING_USER);
    }
    getSessionHistory(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            throw new Error(`Session not found: ${sessionId}`);
        return [...session.history];
    }
    getTurnCount(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            throw new Error(`Session not found: ${sessionId}`);
        return session.history.length;
    }
}
export function createHumanInLoopAdapter(config) {
    return new HumanInLoopAdapter(config);
}
//# sourceMappingURL=adapter.js.map