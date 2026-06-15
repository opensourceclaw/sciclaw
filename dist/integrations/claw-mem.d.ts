/**
 * claw-mem integration - Memory system for research sessions
 */
import type { ResearchSession } from './types.js';
export declare class MemoryIntegration {
    private sessions;
    private maxSessions;
    constructor(maxSessions?: number);
    /**
     * Save a research session to memory
     */
    saveResearchSession(session: ResearchSession): Promise<void>;
    /**
     * Load research history by session ID
     */
    loadResearchHistory(sessionId: string): Promise<ResearchSession | null>;
    /**
     * Get all session IDs
     */
    getSessionIds(): Promise<string[]>;
    /**
     * Search sessions by query
     */
    searchSessions(query: string): Promise<ResearchSession[]>;
    /**
     * Delete a session
     */
    deleteSession(sessionId: string): Promise<boolean>;
    /**
     * Clear all sessions
     */
    clear(): Promise<void>;
    /**
     * Get statistics
     */
    getStats(): {
        total: number;
        maxSessions: number;
    };
}
export declare function getMemory(maxSessions?: number): MemoryIntegration;
//# sourceMappingURL=claw-mem.d.ts.map