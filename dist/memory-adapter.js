/**
 * DeepClaw v3.6.0 — Memory Adapter
 * Full integration with claw-mem v6.40.0 for persistent memory
 */
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
/**
 * DeepClaw Memory Adapter - Full claw-mem v6.40.0 integration
 */
export class DeepClawMemoryAdapter {
    manager = null;
    governance = null;
    enabled = false;
    projectId;
    workspace;
    storeCount = 0;
    searchCount = 0;
    constructor(projectId = "deepclaw") {
        this.projectId = projectId;
        this.workspace = this.resolveWorkspace();
    }
    resolveWorkspace() {
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
    async initialize() {
        try {
            const clawMem = await import("claw-mem");
            // Initialize MemoryManager
            const MemoryManagerClass = clawMem.MemoryManager;
            this.manager = new MemoryManagerClass({ workspace: this.workspace });
            // Initialize MemoryGovernance (v6.40.0)
            if (clawMem.MemoryGovernance) {
                this.governance = new clawMem.MemoryGovernance({
                    importanceThreshold: 0.3,
                    relevanceThreshold: 0.2,
                });
            }
            this.enabled = true;
            console.log(`[DeepClaw] Memory adapter initialized, workspace: ${this.workspace}`);
            console.log(`[DeepClaw] Governance: ${this.governance ? "enabled" : "unavailable"}`);
        }
        catch (error) {
            console.warn("[DeepClaw] Memory adapter initialization failed:", error);
            this.enabled = false;
        }
    }
    /**
     * Store memory with optional governance check
     */
    async store(key, value) {
        if (!this.enabled || !this.manager) {
            console.warn("[DeepClaw] Memory not enabled, skipping store");
            return false;
        }
        // Use governance if available and scores provided
        if (this.governance && value.importance !== undefined && value.relevance !== undefined) {
            const shouldStore = this.governance.select(value.importance, value.relevance);
            if (!shouldStore) {
                console.log(`[DeepClaw] Memory rejected by governance: ${key}`);
                return false;
            }
        }
        const result = this.manager.store(value.content, value.type ?? "episodic", value.tags ?? [], { ...value.metadata, key });
        if (result) {
            this.storeCount++;
            console.log(`[DeepClaw] Stored memory: ${key}`);
        }
        return result;
    }
    /**
     * Search memories by query
     */
    async search(query, type, limit) {
        if (!this.enabled || !this.manager) {
            return [];
        }
        const results = this.manager.search(query, type, limit ?? 10);
        this.searchCount++;
        return results.map((r, i) => ({
            id: r.id ?? `unknown-${i}`,
            content: r.text ?? r.content ?? "",
            type: r.memory_type ?? "episodic",
            score: r.score ?? 1.0 - i * 0.1,
            timestamp: r.created_at ?? new Date().toISOString(),
            tags: r.tags ?? [],
        }));
    }
    /**
     * Retrieve memory by key (uses search)
     */
    async retrieve(key) {
        if (!this.enabled) {
            return null;
        }
        const results = await this.search(key, undefined, 1);
        return results[0] ?? null;
    }
    /**
     * Get memory statistics
     */
    getStats() {
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
    getGovernanceMetrics() {
        if (!this.governance) {
            return null;
        }
        return this.governance.getMetrics();
    }
    isEnabled() {
        return this.enabled;
    }
}
export const memoryAdapter = new DeepClawMemoryAdapter();
//# sourceMappingURL=memory-adapter.js.map