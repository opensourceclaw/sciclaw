/**
 * claw-mem integration - Memory system for research sessions
 */

import type { ResearchSession } from './types.js';

export class MemoryIntegration {
  private sessions: Map<string, ResearchSession> = new Map();
  private maxSessions: number;

  constructor(maxSessions: number = 100) {
    this.maxSessions = maxSessions;
  }

  /**
   * Save a research session to memory
   */
  async saveResearchSession(session: ResearchSession): Promise<void> {
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
  async loadResearchHistory(sessionId: string): Promise<ResearchSession | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  /**
   * Get all session IDs
   */
  async getSessionIds(): Promise<string[]> {
    return Array.from(this.sessions.keys());
  }

  /**
   * Search sessions by query
   */
  async searchSessions(query: string): Promise<ResearchSession[]> {
    const lowerQuery = query.toLowerCase();
    const results: ResearchSession[] = [];

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
  async deleteSession(sessionId: string): Promise<boolean> {
    return this.sessions.delete(sessionId);
  }

  /**
   * Clear all sessions
   */
  async clear(): Promise<void> {
    this.sessions.clear();
  }

  /**
   * Get statistics
   */
  getStats(): { total: number; maxSessions: number } {
    return {
      total: this.sessions.size,
      maxSessions: this.maxSessions,
    };
  }
}

// Global instance
let globalMemory: MemoryIntegration | null = null;

export function getMemory(maxSessions?: number): MemoryIntegration {
  if (!globalMemory) {
    globalMemory = new MemoryIntegration(maxSessions);
  }
  return globalMemory;
}
