/**
 * claw-ctx integration - Context state management
 */
export class ContextIntegration {
    contexts = new Map();
    /**
     * Create a new context
     */
    async createContext(options) {
        const now = Date.now();
        const context = {
            sessionId: options.sessionId,
            ...options.state,
            createdAt: now,
            updatedAt: now,
        };
        this.contexts.set(options.sessionId, context);
        return context;
    }
    /**
     * Restore context by session ID
     */
    async restoreContext(sessionId) {
        return this.contexts.get(sessionId) ?? null;
    }
    /**
     * Update context state
     */
    async updateContext(sessionId, updates) {
        const existing = this.contexts.get(sessionId);
        if (!existing)
            return null;
        const updated = {
            ...existing,
            ...updates,
            sessionId, // Preserve sessionId
            updatedAt: Date.now(),
        };
        this.contexts.set(sessionId, updated);
        return updated;
    }
    /**
     * Delete context
     */
    async deleteContext(sessionId) {
        return this.contexts.delete(sessionId);
    }
    /**
     * List all context IDs
     */
    async listContexts() {
        return Array.from(this.contexts.keys());
    }
    /**
     * Clear all contexts
     */
    async clear() {
        this.contexts.clear();
    }
}
// Global instance
let globalContext = null;
export function getContext() {
    if (!globalContext) {
        globalContext = new ContextIntegration();
    }
    return globalContext;
}
//# sourceMappingURL=claw-ctx.js.map