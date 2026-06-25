import { describe, it, expect, vi } from "vitest";
import { BatchQueue } from "../../src/search/batch.js";

describe("BatchQueue", () => {
  it("enqueues and processes single item", async () => {
    const processor = vi.fn(async (batch: string[]) => batch.map((s) => s.toUpperCase()));
    const q = new BatchQueue({ maxBatchSize: 10, maxWaitMs: 50, flushOnFull: true }, processor);

    const result = await q.enqueue("hello");
    expect(result).toBe("HELLO");
    expect(processor).toHaveBeenCalled();
  });

  it("batches multiple items in window", async () => {
    const processor = vi.fn(async (batch: number[]) => batch.map((n) => n * 2));
    const q = new BatchQueue({ maxBatchSize: 10, maxWaitMs: 30, flushOnFull: false }, processor);

    const results = await Promise.all([q.enqueue(1), q.enqueue(2), q.enqueue(3)]);
    expect(results).toEqual([2, 4, 6]);
    expect(processor).toHaveBeenCalledTimes(1); // all in one batch
  });

  it("flushes when maxBatchSize reached", async () => {
    const processor = vi.fn(async (batch: number[]) => batch.map((n) => n));
    const q = new BatchQueue({ maxBatchSize: 2, maxWaitMs: 5000, flushOnFull: true }, processor);

    const p1 = q.enqueue(1);
    const p2 = q.enqueue(2); // triggers flush

    const results = await Promise.all([p1, p2]);
    expect(results).toEqual([1, 2]);
    expect(processor).toHaveBeenCalledTimes(1);
  });

  it("rejects items on processor error", async () => {
    const processor = vi.fn(async () => { throw new Error("fail"); });
    const q = new BatchQueue({ maxBatchSize: 2, maxWaitMs: 30, flushOnFull: false }, processor);

    await expect(q.enqueue(1)).rejects.toThrow("fail");
  });

  it("manual flush processes pending items", async () => {
    const processor = vi.fn(async (batch: string[]) => batch.map((s) => s + "!"));
    const q = new BatchQueue({ maxBatchSize: 10, maxWaitMs: 5000, flushOnFull: false }, processor);

    const p = q.enqueue("hi");
    await q.flush();
    expect(await p).toBe("hi!");
    expect(processor).toHaveBeenCalled();
  });

  it("pending returns queue length", () => {
    const q = new BatchQueue({ maxBatchSize: 10, maxWaitMs: 5000, flushOnFull: false }, async (b) => b);
    q.enqueue(1);
    q.enqueue(2);
    expect(q.pending).toBe(2);
  });

  it("isProcessing is true during processing", async () => {
    let capturedProcessing = false;
    const processor = vi.fn(async (batch: number[]) => {
      capturedProcessing = q.isProcessing;
      return batch;
    });
    const q = new BatchQueue({ maxBatchSize: 2, maxWaitMs: 30, flushOnFull: false }, processor);
    await q.enqueue(1);
    expect(capturedProcessing).toBe(true);
  });
});
