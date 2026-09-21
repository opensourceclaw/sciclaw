import type { BatchConfig } from "./types.js";
export declare class BatchQueue<T, R> {
    private config;
    private processor;
    private queue;
    private timer;
    private processing;
    constructor(config: BatchConfig | undefined, processor: (batch: T[]) => Promise<R[]>);
    enqueue(item: T): Promise<R>;
    flush(): Promise<void>;
    get pending(): number;
    get isProcessing(): boolean;
}
//# sourceMappingURL=batch.d.ts.map