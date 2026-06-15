/**
 * claw-mem integration - Memory system for research sessions
 */
export class MemoryIntegration {
    sessions = new Map();
    maxSessions;
    constructor(maxSessions = 100) {
        this.maxSessions = maxSessions;
    }
    /**
     * Save a research session to memory
     */
    async saveResearchSession(session) {
        // Evict oldest if at capacity
        if (this.sessions.size >= this.maxSessions) {
            const oldestKey = this.sessions.keys().next().value;
            if (oldestKey) {
                this.sessions.delete(oldestKey);
            }
        }
        this.sessions.set(session.id, session);
    }
    /**
     * Load research history by session ID
     */
    async loadResearchHistory(sessionId) {
        return this.sessions.get(sessionId) ?? null;
    }
    /**
     * Get all session IDs
     */
    async getSessionIds() {
        return Array.from(this.sessions.keys());
    }
    /**
     * Search sessions by query
     */
    async searchSessions(query) {
        const lowerQuery = query.toLowerCase();
        const results = [];
        for (const session of this.sessions.values()) {
            if (session.query.toLowerCase().includes(lowerQuery)) {
                results.push(session);
            }
        }
        return results;
    }
    /**
     * Delete a session
     */
    async deleteSession(sessionId) {
        return this.sessions.delete(sessionId);
    }
    /**
     * Clear all sessions
     */
    async clear() {
        this.sessions.clear();
    }
    /**
     * Get statistics
     */
    getStats() {
        return {
            total: this.sessions.size,
            maxSessions: this.maxSessions,
        };
    }
}
// Global instance
let globalMemory = null;
export function getMemory(maxSessions) {
    if (!globalMemory) {
        globalMemory = new MemoryIntegration(maxSessions);
    }
    return globalMemory;
}
//# sourceMappingURL=claw-mem.js.map