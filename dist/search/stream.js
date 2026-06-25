export class SearchStream {
    listeners = {
        result: [],
        source_complete: [],
        error: [],
        complete: [],
    };
    cancelled = false;
    completedSources = 0;
    totalSources;
    results = [];
    startTime;
    constructor(totalSources) {
        this.totalSources = totalSources;
        this.startTime = Date.now();
    }
    emit(event) {
        if (this.cancelled)
            return;
        switch (event.type) {
            case "result":
                if (event.data)
                    this.results.push(event.data);
                for (const cb of this.listeners.result) {
                    cb(event.data, event.sourceId ?? "unknown");
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
                    cb(event.error, event.sourceId ?? "unknown");
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
    onResult(callback) {
        this.listeners.result.push(callback);
        return () => {
            this.listeners.result = this.listeners.result.filter((c) => c !== callback);
        };
    }
    onSourceComplete(callback) {
        this.listeners.source_complete.push(callback);
        return () => {
            this.listeners.source_complete = this.listeners.source_complete.filter((c) => c !== callback);
        };
    }
    onError(callback) {
        this.listeners.error.push(callback);
        return () => {
            this.listeners.error = this.listeners.error.filter((c) => c !== callback);
        };
    }
    onComplete(callback) {
        this.listeners.complete.push(callback);
        return () => {
            this.listeners.complete = this.listeners.complete.filter((c) => c !== callback);
        };
    }
    cancel() {
        this.cancelled = true;
    }
    get isCancelled() {
        return this.cancelled;
    }
    get progress() {
        if (this.totalSources === 0)
            return 1;
        return this.completedSources / this.totalSources;
    }
}
//# sourceMappingURL=stream.js.map