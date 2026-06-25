import { describe, it, expect, vi } from "vitest";
import { SearchStream } from "../../src/search/stream.js";

describe("SearchStream", () => {
  it("emits result events to listeners", () => {
    const stream = new SearchStream(3);
    const onResult = vi.fn();

    stream.onResult(onResult);
    stream.emit({ type: "result", data: { title: "T", url: "u", snippet: "", source: "duckduckgo" }, sourceId: "s1" });

    expect(onResult).toHaveBeenCalledWith(
      expect.objectContaining({ title: "T" }),
      "s1",
    );
  });

  it("emits complete event", () => {
    const stream = new SearchStream(2);
    const onComplete = vi.fn();

    stream.onComplete(onComplete);
    stream.emit({ type: "complete" });

    expect(onComplete).toHaveBeenCalled();
    const stats = onComplete.mock.calls[0]![0];
    expect(stats.total).toBeGreaterThanOrEqual(0);
    expect(stats.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("emits error events", () => {
    const stream = new SearchStream(3);
    const onError = vi.fn();

    stream.onError(onError);
    stream.emit({ type: "error", error: new Error("fail"), sourceId: "s2" });

    expect(onError).toHaveBeenCalledWith(expect.any(Error), "s2");
  });

  it("emits source_complete events", () => {
    const stream = new SearchStream(2);
    const onSource = vi.fn();

    stream.onSourceComplete(onSource);
    stream.emit({ type: "source_complete", sourceId: "s1" });

    expect(onSource).toHaveBeenCalledWith("s1", []);
  });

  it("cancel stops emitting", () => {
    const stream = new SearchStream(2);
    const onResult = vi.fn();

    stream.onResult(onResult);
    stream.cancel();
    stream.emit({ type: "result", data: { title: "T", url: "u", snippet: "", source: "duckduckgo" }, sourceId: "s1" });

    expect(onResult).not.toHaveBeenCalled();
  });

  it("unsubscribe returns function that removes listener", () => {
    const stream = new SearchStream(1);
    const cb = vi.fn();

    const unsub = stream.onResult(cb);
    unsub();
    stream.emit({ type: "result", data: { title: "T", url: "u", snippet: "", source: "duckduckgo" }, sourceId: "s" });

    expect(cb).not.toHaveBeenCalled();
  });

  it("progress tracks completed sources", () => {
    const stream = new SearchStream(4);
    expect(stream.progress).toBe(0);

    stream.emit({ type: "source_complete", sourceId: "s1" });
    stream.emit({ type: "source_complete", sourceId: "s2" });

    expect(stream.progress).toBe(0.5);
  });

  it("progress is 1 when totalSources is 0", () => {
    const stream = new SearchStream(0);
    expect(stream.progress).toBe(1);
  });

  it("isCancelled returns false initially", () => {
    const stream = new SearchStream(3);
    expect(stream.isCancelled).toBe(false);
  });

  it("isCancelled returns true after cancel", () => {
    const stream = new SearchStream(3);
    stream.cancel();
    expect(stream.isCancelled).toBe(true);
  });

  it("multiple listeners all called", () => {
    const stream = new SearchStream(2);
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    stream.onResult(cb1);
    stream.onResult(cb2);
    stream.emit({ type: "result", data: { title: "T", url: "u", snippet: "", source: "duckduckgo" }, sourceId: "s" });

    expect(cb1).toHaveBeenCalled();
    expect(cb2).toHaveBeenCalled();
  });
});
