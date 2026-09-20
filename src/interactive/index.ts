/**
 * SciClaw v3.0.0 — Interactive Research Engine
 *
 * Unified engine coordinating human-in-the-loop, adaptive queries,
 * and real-time feedback.
 */
import type {
  InteractionSession,
  InteractionMode,
  UserInput,
  ResearchUpdate,
  AdaptiveQuery,
  InteractiveConfig,
} from "./types.js";
import {
  HumanInLoopAdapter,
  createHumanInLoopAdapter,
} from "./adapter.js";
import {
  AdaptiveQueryEngine,
  createAdaptiveQueryEngine,
} from "./queries.js";
import {
  RealTimeFeedback,
  createRealTimeFeedback,
} from "./feedback.js";

export * from "./types.js";
export * from "./adapter.js";
export * from "./queries.js";
export * from "./feedback.js";

// ── Config ─────────────────────────────────────────────────────────────

export interface InteractiveResearchConfig {
  adapter?: Partial<InteractiveConfig>;
  queries?: Partial<InteractiveConfig>;
  feedback?: Partial<InteractiveConfig>;
}

// ── InteractiveResearchEngine ──────────────────────────────────────────

export class InteractiveResearchEngine {
  private adapter: HumanInLoopAdapter;
  private queryEngine: AdaptiveQueryEngine;
  private feedbackHandler: RealTimeFeedback;

  constructor(config?: InteractiveResearchConfig) {
    this.adapter = createHumanInLoopAdapter(config?.adapter);
    this.queryEngine = createAdaptiveQueryEngine(config?.queries);
    this.feedbackHandler = createRealTimeFeedback(config?.feedback);
  }

  start(
    topic: string,
    userId: string,
    mode?: InteractionMode,
  ): InteractionSession {
    return this.adapter.startSession(topic, userId, mode);
  }

  endSession(sessionId: string): InteractionSession {
    return this.adapter.endSession(sessionId);
  }

  getSession(sessionId: string): InteractionSession | undefined {
    return this.adapter.getSession(sessionId);
  }

  processInput(
    sessionId: string,
    input: UserInput,
  ): ResearchUpdate {
    // Process feedback first
    const feedbackResult = this.feedbackHandler.processFeedback(
      sessionId,
      input,
    );

    // Update context from feedback
    if (Object.keys(feedbackResult.contextChanges).length > 0) {
      this.adapter.updateContext(
        sessionId,
        feedbackResult.contextChanges,
      );
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

  generateAdaptiveQuery(sessionId: string): AdaptiveQuery[] {
    const context = this.adapter.getContext(sessionId);
    if (!context) return [];
    let history: import("./types.js").InteractionTurn[] = [];
    try {
      history = this.adapter.getSessionHistory(sessionId);
    } catch {
      // session not found, return empty
      return [];
    }
    return this.queryEngine.generateQueries(context, history);
  }

  startResearch(
    topic: string,
    userId: string,
    mode?: InteractionMode,
  ): { session: InteractionSession; initialQueries: AdaptiveQuery[] } {
    const session = this.adapter.startSession(topic, userId, mode);
    const initialQueries = this.queryEngine.generateQueries(
      session.context,
      [],
    );
    return { session, initialQueries };
  }

  getStats(): {
    activeSessions: number;
    totalTurns: number;
    avgLatency: number;
  } {
    const active = this.adapter.getActiveSessions();
    const totalTurns = active.reduce(
      (s, sess) => s + sess.history.length,
      0,
    );
    const fbStats = this.feedbackHandler.getFeedbackStats();
    return {
      activeSessions: active.length,
      totalTurns,
      avgLatency: fbStats.avgResponseTimeMs,
    };
  }

  getAdapter(): HumanInLoopAdapter {
    return this.adapter;
  }

  getQueryEngine(): AdaptiveQueryEngine {
    return this.queryEngine;
  }

  getFeedbackHandler(): RealTimeFeedback {
    return this.feedbackHandler;
  }
}

export function createInteractiveResearchEngine(
  config?: InteractiveResearchConfig,
): InteractiveResearchEngine {
  return new InteractiveResearchEngine(config);
}
