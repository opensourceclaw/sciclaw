import { describe, it, expect } from "vitest";
import {
  HumanInLoopAdapter,
  createHumanInLoopAdapter,
} from "../../src/interactive/adapter.js";
import {
  InteractionMode,
  SessionStatus,
  FeedbackAction,
} from "../../src/interactive/types.js";

describe("HumanInLoopAdapter", () => {
  let adapter: HumanInLoopAdapter;

  beforeEach(() => {
    adapter = createHumanInLoopAdapter();
  });

  describe("startSession", () => {
    it("starts session with topic and userId", () => {
      const session = adapter.startSession("AI Safety", "user-1");
      expect(session.topic).toBe("AI Safety");
      expect(session.userId).toBe("user-1");
      expect(session.status).toBe(SessionStatus.ACTIVE);
    });

    it("starts session with custom mode", () => {
      const session = adapter.startSession("Topic", "user-1", InteractionMode.GUIDED);
      expect(session.mode).toBe(InteractionMode.GUIDED);
    });

    it("generates unique session IDs", () => {
      const s1 = adapter.startSession("A", "u1");
      const s2 = adapter.startSession("B", "u2");
      expect(s1.id).not.toBe(s2.id);
    });

    it("throws on empty topic", () => {
      expect(() => adapter.startSession("", "user-1")).toThrow("Topic is required");
    });
  });

  describe("processInput", () => {
    it("processes ACCEPT input", () => {
      const session = adapter.startSession("T", "U");
      const input = {
        id: "in-1",
        action: FeedbackAction.ACCEPT,
        content: "Looks good",
      };
      const update = adapter.processInput(session.id, input);
      expect(update.summary).toContain("accept");
      expect(update.phase).toBe("response");
    });

    it("processes REJECT input", () => {
      const session = adapter.startSession("T", "U");
      const input = {
        id: "in-2",
        action: FeedbackAction.REJECT,
        content: "Wrong direction",
      };
      const update = adapter.processInput(session.id, input);
      expect(update.summary).toContain("reject");
    });

    it("processes MODIFY input", () => {
      const session = adapter.startSession("T", "U");
      const input = {
        id: "in-3",
        action: FeedbackAction.MODIFY,
        content: "Change to X",
      };
      adapter.processInput(session.id, input);
      const ctx = adapter.getContext(session.id);
      expect(ctx?.focus).toContain("Change to X");
    });

    it("processes REFINE input", () => {
      const session = adapter.startSession("T", "U");
      const input = {
        id: "in-4",
        action: FeedbackAction.REFINE,
        content: "More details",
      };
      adapter.processInput(session.id, input);
      const ctx = adapter.getContext(session.id);
      expect(ctx?.depth).toBe(1);
    });

    it("processes SKIP input", () => {
      const session = adapter.startSession("T", "U");
      const input = {
        id: "in-5",
        action: FeedbackAction.SKIP,
        content: "Skip this",
      };
      const update = adapter.processInput(session.id, input);
      expect(update.summary).toContain("skip");
    });

    it("processes REDIRECT input", () => {
      const session = adapter.startSession("T", "U");
      const input = {
        id: "in-6",
        action: FeedbackAction.REDIRECT,
        content: "New topic",
      };
      adapter.processInput(session.id, input);
      const ctx = adapter.getContext(session.id);
      expect(ctx?.focus).toContain("New topic");
    });

    it("updates confidence on ACCEPT", () => {
      const session = adapter.startSession("T", "U");
      const input = {
        id: "in-7",
        action: FeedbackAction.ACCEPT,
        content: "Good",
      };
      adapter.processInput(session.id, input);
      const ctx = adapter.getContext(session.id);
      expect(ctx!.confidence).toBeGreaterThan(0.5);
    });

    it("throws on unknown session", () => {
      const input = {
        id: "in-x",
        action: FeedbackAction.ACCEPT,
        content: "test",
      };
      expect(() => adapter.processInput("bad-id", input)).toThrow("Session not found");
    });

    it("throws on expired session", () => {
      const a = createHumanInLoopAdapter({ sessionTimeoutMs: 60000 });
      const session = a.startSession("T", "U");
      // Manually mark as expired
      const s = a.getSession(session.id)!;
      s.status = SessionStatus.EXPIRED;
      const input = {
        id: "in-e",
        action: FeedbackAction.ACCEPT,
        content: "test",
      };
      expect(() => a.processInput(session.id, input)).toThrow();
    });
  });

  describe("lifecycle", () => {
    it("pauses and resumes session", () => {
      const session = adapter.startSession("T", "U");
      adapter.pauseSession(session.id);
      expect(adapter.getSession(session.id)!.status).toBe(SessionStatus.PAUSED);

      adapter.resumeSession(session.id);
      expect(adapter.getSession(session.id)!.status).toBe(SessionStatus.ACTIVE);
    });

    it("ends session", () => {
      const session = adapter.startSession("T", "U");
      adapter.endSession(session.id);
      expect(adapter.getSession(session.id)!.status).toBe(SessionStatus.COMPLETED);
    });
  });

  describe("getActiveSessions", () => {
    it("returns only active sessions", () => {
      const s1 = adapter.startSession("A", "u1");
      const s2 = adapter.startSession("B", "u2");
      adapter.endSession(s2.id);

      const active = adapter.getActiveSessions();
      expect(active).toHaveLength(1);
      expect(active[0]!.id).toBe(s1.id);
    });
  });

  describe("getSessionHistory", () => {
    it("returns turn history", () => {
      const session = adapter.startSession("T", "U");
      adapter.processInput(session.id, {
        id: "in-1",
        action: FeedbackAction.ACCEPT,
        content: "ok",
      });
      const history = adapter.getSessionHistory(session.id);
      expect(history).toHaveLength(1);
      expect(history[0]!.turnNumber).toBe(1);
    });
  });

  describe("getTurnCount", () => {
    it("returns turn count", () => {
      const session = adapter.startSession("T", "U");
      adapter.processInput(session.id, {
        id: "in-1",
        action: FeedbackAction.ACCEPT,
        content: "ok",
      });
      adapter.processInput(session.id, {
        id: "in-2",
        action: FeedbackAction.ACCEPT,
        content: "ok",
      });
      expect(adapter.getTurnCount(session.id)).toBe(2);
    });
  });

  describe("requestUserInput", () => {
    it("adds system message turn", () => {
      const session = adapter.startSession("T", "U");
      adapter.requestUserInput(session.id, {
        id: "msg-1",
        type: "question",
        content: "What next?",
        requiresResponse: true,
      });
      const history = adapter.getSessionHistory(session.id);
      expect(history).toHaveLength(1);
      expect(history[0]!.systemMessage?.content).toBe("What next?");
    });
  });
});
