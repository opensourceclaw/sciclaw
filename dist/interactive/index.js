import { createHumanInLoopAdapter, } from "./adapter.js";
import { createAdaptiveQueryEngine, } from "./queries.js";
import { createRealTimeFeedback, } from "./feedback.js";
export * from "./types.js";
export * from "./adapter.js";
export * from "./queries.js";
export * from "./feedback.js";
// ── InteractiveResearchEngine ──────────────────────────────────────────
export class InteractiveResearchEngine {
    adapter;
    queryEngine;
    feedbackHandler;
    constructor(config) {
        this.adapter = createHumanInLoopAdapter(config?.adapter);
        this.queryEngine = createAdaptiveQueryEngine(config?.queries);
        this.feedbackHandler = createRealTimeFeedback(config?.feedback);
    }
    start(topic, userId, mode) {
        return this.adapter.startSession(topic, userId, mode);
    }
    endSession(sessionId) {
        return this.adapter.endSession(sessionId);
    }
    getSession(sessionId) {
        return this.adapter.getSession(sessionId);
    }
    processInput(sessionId, input) {
        // Process feedback first
        const feedbackResult = this.feedbackHandler.processFeedback(sessionId, input);
        // Update context from feedback
        if (Object.keys(feedbackResult.contextChanges).length > 0) {
            this.adapter.updateContext(sessionId, feedbackResult.contextChanges);
        }
        // Process through adapter
        const update = this.adapter.processInput(sessionId, input);
        // Generate adaptive queries
        const context = this.adapter.getContext(sessionId);
        const history = this.adapter.getSessionHistory(sessionId);
        if (context) {
            const queries = this.queryEngine.generateQueries(context, history);
            update.newQueries = queries;
        }
        return update;
    }
    generateAdaptiveQuery(sessionId) {
        const context = this.adapter.getContext(sessionId);
        if (!context)
            return [];
        let history = [];
        try {
            history = this.adapter.getSessionHistory(sessionId);
        }
        catch {
            // session not found, return empty
            return [];
        }
        return this.queryEngine.generateQueries(context, history);
    }
    startResearch(topic, userId, mode) {
        const session = this.adapter.startSession(topic, userId, mode);
        const initialQueries = this.queryEngine.generateQueries(session.context, []);
        return { session, initialQueries };
    }
    getStats() {
        const active = this.adapter.getActiveSessions();
        const totalTurns = active.reduce((s, sess) => s + sess.history.length, 0);
        const fbStats = this.feedbackHandler.getFeedbackStats();
        return {
            activeSessions: active.length,
            totalTurns,
            avgLatency: fbStats.avgResponseTimeMs,
        };
    }
    getAdapter() {
        return this.adapter;
    }
    getQueryEngine() {
        return this.queryEngine;
    }
    getFeedbackHandler() {
        return this.feedbackHandler;
    }
}
export function createInteractiveResearchEngine(config) {
    return new InteractiveResearchEngine(config);
}
//# sourceMappingURL=index.js.map