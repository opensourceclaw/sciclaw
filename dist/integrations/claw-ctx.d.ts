/**
 * claw-ctx integration - Context state management
 */
import type { ContextState } from './types.js';
export declare class ContextIntegration {
    private contexts;
    /**
     * Create a new context
     */
    createContext(options: {
        sessionId: string;
        state?: Record<string, unknown>;
    }): Promise<ContextState>;
    /**
     * Restore context by session ID
     */
    restoreContext(sessionId: string): Promise<ContextState | null>;
    /**
     * Update context state
     */
    updateContext(sessionId: string, updates: Partial<ContextState>): Promise<ContextState | null>;
    /**
     * Delete context
     */
    deleteContext(sessionId: string): Promise<boolean>;
    /**
     * List all context IDs
     */
    listContexts(): Promise<string[]>;
    /**
     * Clear all contexts
     */
    clear(): Promise<void>;
}
export declare function getContext(): ContextIntegration;
//# sourceMappingURL=claw-ctx.d.ts.map