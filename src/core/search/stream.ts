import type { SearchResult } from "../types/index.js";
import type { StreamEvent, StreamCallback } from "./types.js";

type Listeners = {
  result: Array<(result: SearchResult, sourceId: string) => void>;
  source_complete: Array<(sourceId: string, results: SearchResult[]) => void>;
  error: Array<(error: Error, sourceId: string) => void>;
  complete: Array<(stats: { total: number; latencyMs: number }) => void>;
};

export class SearchStream {
  private listeners: Listeners = {
    result: [],
    source_complete: [],
    error: [],
    complete: [],
  };
  private cancelled = false;
  private completedSources = 0;
  private totalSources: number;
  private results: SearchResult[] = [];
  private startTime: number;

  constructor(totalSources: number) {
    this.totalSources = totalSources;
    this.startTime = Date.now();
  }

  emit(event: StreamEvent): void {
    if (this.cancelled) return;

    switch (event.type) {
      case "result":
        if (event.data) this.results.push(event.data);
        for (const cb of this.listeners.result) {
          cb(event.data!, event.sourceId ?? "unknown");
        }
        break;
      case "source_complete":
        this.completedSources++;
        for (const cb of this.listeners.source_complete) {
          // Results array rebuilt per-source not tracked here; pass empty
          cb(event.sourceId ?? "unknown", []);
        }
        break;
      case "error":
        for (const cb of this.listeners.error) {
          cb(event.error!, event.sourceId ?? "unknown");
        }
        break;
      case "complete":
        for (const cb of this.listeners.complete) {
          cb({
            total: this.results.length,
            latencyMs: Date.now() - this.startTime,
          });
        }
        break;
    }
  }

  onResult(callback: (result: SearchResult, sourceId: string) => void): () => void {
    this.listeners.result.push(callback);
    return () => {
      this.listeners.result = this.listeners.result.filter((c) => c !== callback);
    };
  }

  onSourceComplete(callback: (sourceId: string, results: SearchResult[]) => void): () => void {
    this.listeners.source_complete.push(callback);
    return () => {
      this.listeners.source_complete = this.listeners.source_complete.filter((c) => c !== callback);
    };
  }

  onError(callback: (error: Error, sourceId: string) => void): () => void {
    this.listeners.error.push(callback);
    return () => {
      this.listeners.error = this.listeners.error.filter((c) => c !== callback);
    };
  }

  onComplete(callback: (stats: { total: number; latencyMs: number }) => void): () => void {
    this.listeners.complete.push(callback);
    return () => {
      this.listeners.complete = this.listeners.complete.filter((c) => c !== callback);
    };
  }

  cancel(): void {
    this.cancelled = true;
  }

  get isCancelled(): boolean {
    return this.cancelled;
  }

  get progress(): number {
    if (this.totalSources === 0) return 1;
    return this.completedSources / this.totalSources;
  }
}
