/**
 * claw-ctx integration - Context state management
 */

import type { ContextState } from './types.js';

export class ContextIntegration {
  private contexts: Map<string, ContextState> = new Map();

  /**
   * Create a new context
   */
  async createContext(options: {
    sessionId: string;
    state?: Record<string, unknown>;
  }): Promise<ContextState> {
    const now = Date.now();
    const context: ContextState = {
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
  async restoreContext(sessionId: string): Promise<ContextState | null> {
    return this.contexts.get(sessionId) ?? null;
  }

  /**
   * Update context state
   */
  async updateContext(
    sessionId: string,
    updates: Partial<ContextState>
  ): Promise<ContextState | null> {
    const existing = this.contexts.get(sessionId);
    if (!existing) return null;

    const updated: ContextState = {
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
  async deleteContext(sessionId: string): Promise<boolean> {
    return this.contexts.delete(sessionId);
  }

  /**
   * List all context IDs
   */
  async listContexts(): Promise<string[]> {
    return Array.from(this.contexts.keys());
  }

  /**
   * Clear all contexts
   */
  async clear(): Promise<void> {
    this.contexts.clear();
  }
}

// Global instance
let globalContext: ContextIntegration | null = null;

export function getContext(): ContextIntegration {
  if (!globalContext) {
    globalContext = new ContextIntegration();
  }
  return globalContext;
}
