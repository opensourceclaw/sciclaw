/**
 * SciClaw v3.0.0-rc.3 — Summarization Errors tests
 */
import { describe, it, expect } from "vitest";
import {
  ErrorSeverity,
  SummarizationError,
  LLMError,
  RateLimitError,
  FallbackError,
  ValidationError,
  TimeoutError,
} from "../../src/summarization/errors.js";

describe("SummarizationError", () => {
  it("creates with default severity", () => {
    const err = new SummarizationError("test error");
    expect(err.message).toBe("test error");
    expect(err.name).toBe("SummarizationError");
    expect(err.severity).toBe(ErrorSeverity.MEDIUM);
    expect(err.details).toEqual({});
  });

  it("creates with custom severity and details", () => {
    const err = new SummarizationError("critical", ErrorSeverity.CRITICAL, { key: "val" });
    expect(err.severity).toBe(ErrorSeverity.CRITICAL);
    expect(err.details.key).toBe("val");
  });

  it("stores original error", () => {
    const original = new Error("original");
    const err = new SummarizationError("wrapped", ErrorSeverity.HIGH, {}, original);
    expect(err.originalError).toBe(original);
  });
});

describe("LLMError", () => {
  it("creates with status code and provider", () => {
    const err = new LLMError("llm failed", 429, "openai");
    expect(err.name).toBe("LLMError");
    expect(err.message).toBe("llm failed");
    expect(err.statusCode).toBe(429);
    expect(err.provider).toBe("openai");
    expect(err.severity).toBe(ErrorSeverity.HIGH);
  });
});

describe("RateLimitError", () => {
  it("creates with default message", () => {
    const err = new RateLimitError();
    expect(err.name).toBe("RateLimitError");
    expect(err.message).toBe("Rate limit exceeded");
    expect(err.severity).toBe(ErrorSeverity.MEDIUM);
  });

  it("creates with retryAfter", () => {
    const err = new RateLimitError("custom", 60);
    expect(err.message).toBe("custom");
    expect(err.retryAfter).toBe(60);
  });
});

describe("FallbackError", () => {
  it("creates with default message", () => {
    const err = new FallbackError();
    expect(err.name).toBe("FallbackError");
    expect(err.message).toBe("All fallback strategies exhausted");
    expect(err.severity).toBe(ErrorSeverity.CRITICAL);
  });

  it("creates with attempts count", () => {
    const err = new FallbackError("all failed", 3);
    expect(err.attempts).toBe(3);
  });
});

describe("ValidationError", () => {
  it("creates with field name", () => {
    const err = new ValidationError("invalid input", "topic");
    expect(err.name).toBe("ValidationError");
    expect(err.field).toBe("topic");
    expect(err.severity).toBe(ErrorSeverity.LOW);
  });
});

describe("TimeoutError", () => {
  it("creates with default message", () => {
    const err = new TimeoutError();
    expect(err.name).toBe("TimeoutError");
    expect(err.message).toBe("Operation timed out");
    expect(err.severity).toBe(ErrorSeverity.MEDIUM);
  });

  it("creates with timeout value", () => {
    const err = new TimeoutError("slow", 5000);
    expect(err.timeoutValue).toBe(5000);
  });
});
