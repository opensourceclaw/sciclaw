import { describe, it, expect } from "vitest";
import {
  InteractiveResearchEngine,
  createInteractiveResearchEngine,
} from "../../src/interactive/index.js";
import { HumanInLoopAdapter } from "../../src/interactive/adapter.js";
import { AdaptiveQueryEngine } from "../../src/interactive/queries.js";
import { RealTimeFeedback } from "../../src/interactive/feedback.js";
import {
  InteractionMode,
  SessionStatus,
  FeedbackAction,
  QueryType,
} from "../../src/interactive/types.js";

describe("InteractiveResearchEngine", () => {
  let engine: InteractiveResearchEngine;

  beforeEach(() => {
    engine = createInteractiveResearchEngine();
  });

  it("creates engine instance", () => {
    expect(engine).toBeInstanceOf(InteractiveResearchEngine);
  });

  it("startResearch returns session and initial queries", () => {
    const result = engine.startResearch("AI Safety", "user-1");
    expect(result.session).toBeDefined();
    expect(result.session.topic).toBe("AI Safety");
    expect(result.initialQueries.length).toBeGreaterThan(0);
  });

  it("start creates session", () => {
    const session = engine.start("Topic", "user-1", InteractionMode.GUIDED);
    expect(session.mode).toBe(InteractionMode.GUIDED);
  });

  it("processInput returns ResearchUpdate with queries", () => {
    const session = engine.start("Topic", "user-1");
    const update = engine.processInput(session.id, {
      id: "in-1",
      action: FeedbackAction.ACCEPT,
      content: "looks good",
    });
    expect(update.sessionId).toBe(session.id);
    expect(update.summary).toBeDefined();
  });

  it("generateAdaptiveQuery returns queries for session", () => {
    const session = engine.start("AI Research", "user-1");
    const queries = engine.generateAdaptiveQuery(session.id);
    expect(queries.length).toBeGreaterThan(0);
  });

  it("generateAdaptiveQuery returns empty for unknown session", () => {
    const queries = engine.generateAdaptiveQuery("bad-id");
    expect(queries).toEqual([]);
  });

  it("endSession completes session", () => {
    const session = engine.start("T", "U");
    engine.endSession(session.id);
    const s = engine.getSession(session.id);
    expect(s!.status).toBe(SessionStatus.COMPLETED);
  });

  it("getSession returns undefined for unknown id", () => {
    expect(engine.getSession("bad-id")).toBeUndefined();
  });

  it("getStats returns metrics", () => {
    const session = engine.start("T", "U");
    engine.processInput(session.id, {
      id: "in-1",
      action: FeedbackAction.ACCEPT,
      content: "ok",
    });
    const stats = engine.getStats();
    expect(stats.activeSessions).toBeGreaterThanOrEqual(1);
    expect(stats.totalTurns).toBeGreaterThanOrEqual(1);
  });

  it("getAdapter returns adapter", () => {
    expect(engine.getAdapter()).toBeInstanceOf(HumanInLoopAdapter);
  });

  it("getQueryEngine returns query engine", () => {
    expect(engine.getQueryEngine()).toBeInstanceOf(AdaptiveQueryEngine);
  });

  it("getFeedbackHandler returns feedback handler", () => {
    expect(engine.getFeedbackHandler()).toBeInstanceOf(RealTimeFeedback);
  });

  it("full interaction loop: start -> input -> adapt", () => {
    const { session } = engine.startResearch("AI", "user-1");
    expect(session.status).toBe(SessionStatus.ACTIVE);

    const update = engine.processInput(session.id, {
      id: "in-1",
      action: FeedbackAction.REFINE,
      content: "more depth",
    });
    expect(update.newQueries).toBeDefined();
    expect(update.newQueries!.length).toBeGreaterThan(0);
  });
});

describe("barrel exports", () => {
  it("exports InteractionMode enum", () => {
    expect(InteractionMode.COLLABORATIVE).toBe("collaborative");
  });

  it("exports QueryType enum", () => {
    expect(QueryType.CLARIFICATION).toBe("clarification");
  });

  it("exports FeedbackAction enum", () => {
    expect(FeedbackAction.ACCEPT).toBe("accept");
  });

  it("exports SessionStatus enum", () => {
    expect(SessionStatus.ACTIVE).toBe("active");
  });

  it("exports HumanInLoopAdapter class", () => {
    expect(HumanInLoopAdapter).toBeDefined();
  });

  it("exports AdaptiveQueryEngine class", () => {
    expect(AdaptiveQueryEngine).toBeDefined();
  });

  it("exports RealTimeFeedback class", () => {
    expect(RealTimeFeedback).toBeDefined();
  });

  it("exports InteractiveResearchEngine class", () => {
    expect(InteractiveResearchEngine).toBeDefined();
  });
});

describe("factory functions", () => {
  it("createInteractiveResearchEngine creates engine", () => {
    const e = createInteractiveResearchEngine();
    expect(e).toBeInstanceOf(InteractiveResearchEngine);
  });

  it("createInteractiveResearchEngine accepts config", () => {
    const e = createInteractiveResearchEngine({
      adapter: { maxTurns: 10 },
      queries: { adaptiveQueryMaxPerTurn: 5 },
    });
    expect(e).toBeInstanceOf(InteractiveResearchEngine);
  });
});
