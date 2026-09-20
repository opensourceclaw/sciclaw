/**
 * SciClaw v3.6.0 — Memory Adapter
 * Full integration with claw-mem v6.40.0 for persistent memory
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// Types for claw-mem (lazy-loaded)
interface MemoryManager {
  store(content: string, memoryType?: string, tags?: string[], metadata?: Record<string, unknown>): boolean;
  search(query: string, memoryType?: string, limit?: number): Array<Record<string, unknown>>;
  getStats(): Record<string, unknown>;
  sessionId: string | null;
  workspace: string;
}

interface MemoryGovernance {
  select(importance: number, relevance: number): boolean;
  maintain(age: number, accessCount: number): "keep" | "refresh" | "forget";
  getMetrics(): { totalDecisions: number; stored: number; rejected: number };
}

/**
 * Memory value to store
 */
export interface MemoryValue {
  content: string;
  type?: "episodic" | "semantic" | "procedural" | "fact" | "preference";
  tags?: string[];
  metadata?: Record<string, unknown>;
  importance?: number;
  relevance?: number;
}

/**
 * Search result from memory
 */
export interface MemorySearchResult {
  id: string;
  content: string;
  type: string;
  score: number;
  timestamp: string;
  tags?: string[];
}

/**
 * SciClaw Memory Adapter - Full claw-mem v6.40.0 integration
 */
export class SciClawMemoryAdapter {
  private manager: MemoryManager | null = null;
  private governance: MemoryGovernance | null = null;
  private enabled: boolean = false;
  private projectId: string;
  private workspace: string;
  private storeCount: number = 0;
  private searchCount: number = 0;

  constructor(projectId: string = "deepclaw") {
    this.projectId = projectId;
    this.workspace = this.resolveWorkspace();
  }

  private resolveWorkspace(): string {
    const envWorkspace = process.env.DEEPCLAW_MEMORY_WORKSPACE;
    if (envWorkspace) {
      return envWorkspace;
    }
    const projectLocal = path.join(process.cwd(), ".claw-mem");
    if (fs.existsSync(projectLocal)) {
      return projectLocal;
    }
    return path.join(os.homedir(), ".claw-mem", "projects", this.projectId);
  }

  /**
   * Initialize memory system with claw-mem v6.40.0
   */
  async initialize(): Promise<void> {
    try {
      const clawMem = await import("claw-mem");

      // Initialize MemoryManager
      const MemoryManagerClass = clawMem.MemoryManager as new (opts?: { workspace?: string }) => MemoryManager;
      this.manager = new MemoryManagerClass({ workspace: this.workspace });

      // Initialize MemoryGovernance (v6.40.0)
      if (clawMem.MemoryGovernance) {
        this.governance = new clawMem.MemoryGovernance({
          importanceThreshold: 0.3,
          relevanceThreshold: 0.2,
        }) as MemoryGovernance;
      }

      this.enabled = true;
      console.log(`[SciClaw] Memory adapter initialized, workspace: ${this.workspace}`);
      console.log(`[SciClaw] Governance: ${this.governance ? "enabled" : "unavailable"}`);
    } catch (error) {
      console.warn("[SciClaw] Memory adapter initialization failed:", error);
      this.enabled = false;
    }
  }

  /**
   * Store memory with optional governance check
   */
  async store(key: string, value: MemoryValue): Promise<boolean> {
    if (!this.enabled || !this.manager) {
      console.warn("[SciClaw] Memory not enabled, skipping store");
      return false;
    }

    // Use governance if available and scores provided
    if (this.governance && value.importance !== undefined && value.relevance !== undefined) {
      const shouldStore = this.governance.select(value.importance, value.relevance);
      if (!shouldStore) {
        console.log(`[SciClaw] Memory rejected by governance: ${key}`);
        return false;
      }
    }

    const result = this.manager.store(
      value.content,
      value.type ?? "episodic",
      value.tags ?? [],
      { ...value.metadata, key }
    );

    if (result) {
      this.storeCount++;
      console.log(`[SciClaw] Stored memory: ${key}`);
    }

    return result;
  }

  /**
   * Search memories by query
   */
  async search(query: string, type?: string, limit?: number): Promise<MemorySearchResult[]> {
    if (!this.enabled || !this.manager) {
      return [];
    }

    const results = this.manager.search(query, type, limit ?? 10);
    this.searchCount++;

    return results.map((r, i) => ({
      id: (r.id as string) ?? `unknown-${i}`,
      content: (r.text as string) ?? (r.content as string) ?? "",
      type: (r.memory_type as string) ?? "episodic",
      score: (r.score as number) ?? 1.0 - i * 0.1,
      timestamp: (r.created_at as string) ?? new Date().toISOString(),
      tags: (r.tags as string[]) ?? [],
    }));
  }

  /**
   * Retrieve memory by key (uses search)
   */
  async retrieve(key: string): Promise<MemorySearchResult | null> {
    if (!this.enabled) {
      return null;
    }

    const results = await this.search(key, undefined, 1);
    return results[0] ?? null;
  }

  /**
   * Get memory statistics
   */
  getStats(): {
    enabled: boolean;
    storeCount: number;
    searchCount: number;
    governanceEnabled: boolean;
    workspace: string;
  } {
    return {
      enabled: this.enabled,
      storeCount: this.storeCount,
      searchCount: this.searchCount,
      governanceEnabled: this.governance !== null,
      workspace: this.workspace,
    };
  }

  /**
   * Get governance metrics (v6.40.0)
   */
  getGovernanceMetrics(): { totalDecisions: number; stored: number; rejected: number } | null {
    if (!this.governance) {
      return null;
    }
    return this.governance.getMetrics();
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const memoryAdapter = new SciClawMemoryAdapter();
