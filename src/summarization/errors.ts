/**
 * Error handling for summarization module
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export class SummarizationError extends Error {
  severity: ErrorSeverity;
  details: Record<string, unknown>;
  originalError?: Error;

  constructor(
    message: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    details: Record<string, unknown> = {},
    originalError?: Error,
  ) {
    super(message);
    this.name = 'SummarizationError';
    this.severity = severity;
    this.details = details;
    this.originalError = originalError;
  }
}

export class LLMError extends SummarizationError {
  statusCode?: number;
  provider?: string;

  constructor(
    message: string,
    statusCode?: number,
    provider?: string,
    extra: Record<string, unknown> = {},
  ) {
    super(message, ErrorSeverity.HIGH, { statusCode, provider, ...extra });
    this.name = 'LLMError';
    this.statusCode = statusCode;
    this.provider = provider;
  }
}

export class RateLimitError extends LLMError {
  retryAfter?: number;

  constructor(message = 'Rate limit exceeded', retryAfter?: number, extra: Record<string, unknown> = {}) {
    super(message, undefined, undefined, { retryAfter, ...extra });
    this.name = 'RateLimitError';
    this.severity = ErrorSeverity.MEDIUM;
    this.retryAfter = retryAfter;
  }
}

export class FallbackError extends SummarizationError {
  attempts: number;

  constructor(message = 'All fallback strategies exhausted', attempts = 0, extra: Record<string, unknown> = {}) {
    super(message, ErrorSeverity.CRITICAL, { attempts, ...extra });
    this.name = 'FallbackError';
    this.attempts = attempts;
  }
}

export class ValidationError extends SummarizationError {
  field?: string;

  constructor(message: string, field?: string, extra: Record<string, unknown> = {}) {
    super(message, ErrorSeverity.LOW, { field, ...extra });
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class TimeoutError extends SummarizationError {
  timeoutValue?: number;

  constructor(message = 'Operation timed out', timeoutValue?: number, extra: Record<string, unknown> = {}) {
    super(message, ErrorSeverity.MEDIUM, { timeout: timeoutValue, ...extra });
    this.name = 'TimeoutError';
    this.timeoutValue = timeoutValue;
  }
}
