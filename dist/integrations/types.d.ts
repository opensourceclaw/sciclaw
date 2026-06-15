/**
 * Integration types for claw-xxx plugins
 */
export interface ResearchSession {
    id: string;
    query: string;
    results: Array<{
        title: string;
        url: string;
        snippet: string;
    }>;
    timestamp: number;
    metadata?: Record<string, unknown>;
}
export interface ContextState {
    sessionId: string;
    query?: string;
    results?: unknown[];
    createdAt: number;
    updatedAt: number;
}
export interface ObsEvent {
    name: string;
    timestamp: number;
    data: Record<string, unknown>;
}
export interface ObsMetrics {
    events: number;
    errors: number;
    duration: number;
    custom: Record<string, number>;
}
//# sourceMappingURL=types.d.ts.map