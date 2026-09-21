import { DEFAULT_BATCH_CONFIG } from "./types.js";
let idCounter = 0;
export class BatchQueue {
    config;
    processor;
    queue = [];
    timer = null;
    processing = false;
    constructor(config = { ...DEFAULT_BATCH_CONFIG }, processor) {
        this.config = config;
        this.processor = processor;
    }
    enqueue(item) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                id: `batch_${++idCounter}`,
                data: item,
                resolve: resolve,
                reject,
                createdAt: Date.now(),
            });
            if (this.config.flushOnFull && this.queue.length >= this.config.maxBatchSize) {
                this.flush();
            }
            else if (this.timer === null) {
                this.timer = setTimeout(() => this.flush(), this.config.maxWaitMs);
            }
        });
    }
    async flush() {
        if (this.processing || this.queue.length === 0)
            return;
        this.processing = true;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        const batch = this.queue.splice(0, this.config.maxBatchSize);
        try {
            const results = await this.processor(batch.map((e) => e.data));
            for (let i = 0; i < batch.length; i++) {
                const entry = batch[i];
                if (i < results.length) {
                    entry.resolve(results[i]);
                }
                else {
                    entry.reject(new Error("Batch result count mismatch"));
                }
            }
        }
        catch (e) {
            for (const entry of batch) {
                entry.reject(e);
            }
        }
        this.processing = false;
        if (this.queue.length > 0) {
            this.timer = setTimeout(() => this.flush(), 0);
        }
    }
    get pending() {
        return this.queue.length;
    }
    get isProcessing() {
        return this.processing;
    }
}
//# sourceMappingURL=batch.js.map