/**
 * SciClaw v3.0.0 — Human-in-the-Loop Adapter
 *
 * Session management and user interaction processing.
 */
import { InteractionMode } from "./types.js";
import type { InteractionSession, InteractionTurn, SystemMessage, UserInput, SessionContext, ResearchUpdate, InteractiveConfig } from "./types.js";
export declare class HumanInLoopAdapter {
    private config;
    private sessions;
    constructor(config?: Partial<InteractiveConfig>);
    startSession(topic: string, userId: string, mode?: InteractionMode): InteractionSession;
    getSession(sessionId: string): InteractionSession | undefined;
    endSession(sessionId: string): InteractionSession;
    pauseSession(sessionId: string): InteractionSession;
    resumeSession(sessionId: string): InteractionSession;
    processInput(sessionId: string, input: UserInput): ResearchUpdate;
    requestUserInput(sessionId: string, message: SystemMessage): InteractionSession;
    updateContext(sessionId: string, updates: Partial<SessionContext>): SessionContext;
    getContext(sessionId: string): SessionContext | undefined;
    getActiveSessions(): InteractionSession[];
    getSessionHistory(sessionId: string): InteractionTurn[];
    getTurnCount(sessionId: string): number;
}
export declare function createHumanInLoopAdapter(config?: Partial<InteractiveConfig>): HumanInLoopAdapter;
//# sourceMappingURL=adapter.d.ts.map