/**
 * SciClaw v3.6.0 — Memory Adapter
 * Full integration with claw-mem v6.40.0 for persistent memory
 */
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
export declare class SciClawMemoryAdapter {
    private manager;
    private governance;
    private enabled;
    private projectId;
    private workspace;
    private storeCount;
    private searchCount;
    constructor(projectId?: string);
    private resolveWorkspace;
    /**
     * Initialize memory system with claw-mem v6.40.0
     */
    initialize(): Promise<void>;
    /**
     * Store memory with optional governance check
     */
    store(key: string, value: MemoryValue): Promise<boolean>;
    /**
     * Search memories by query
     */
    search(query: string, type?: string, limit?: number): Promise<MemorySearchResult[]>;
    /**
     * Retrieve memory by key (uses search)
     */
    retrieve(key: string): Promise<MemorySearchResult | null>;
    /**
     * Get memory statistics
     */
    getStats(): {
        enabled: boolean;
        storeCount: number;
        searchCount: number;
        governanceEnabled: boolean;
        workspace: string;
    };
    /**
     * Get governance metrics (v6.40.0)
     */
    getGovernanceMetrics(): {
        totalDecisions: number;
        stored: number;
        rejected: number;
    } | null;
    isEnabled(): boolean;
}
export declare const memoryAdapter: SciClawMemoryAdapter;
//# sourceMappingURL=memory-adapter.d.ts.map