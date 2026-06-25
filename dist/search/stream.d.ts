import type { SearchResult } from "../types/index.js";
import type { StreamEvent } from "./types.js";
export declare class SearchStream {
    private listeners;
    private cancelled;
    private completedSources;
    private totalSources;
    private results;
    private startTime;
    constructor(totalSources: number);
    emit(event: StreamEvent): void;
    onResult(callback: (result: SearchResult, sourceId: string) => void): () => void;
    onSourceComplete(callback: (sourceId: string, results: SearchResult[]) => void): () => void;
    onError(callback: (error: Error, sourceId: string) => void): () => void;
    onComplete(callback: (stats: {
        total: number;
        latencyMs: number;
    }) => void): () => void;
    cancel(): void;
    get isCancelled(): boolean;
    get progress(): number;
}
//# sourceMappingURL=stream.d.ts.map