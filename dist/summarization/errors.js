/**
 * Error handling for summarization module
 */
export var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (ErrorSeverity = {}));
export class SummarizationError extends Error {
    severity;
    details;
    originalError;
    constructor(message, severity = ErrorSeverity.MEDIUM, details = {}, originalError) {
        super(message);
        this.name = 'SummarizationError';
        this.severity = severity;
        this.details = details;
        this.originalError = originalError;
    }
}
export class LLMError extends SummarizationError {
    statusCode;
    provider;
    constructor(message, statusCode, provider, extra = {}) {
        super(message, ErrorSeverity.HIGH, { statusCode, provider, ...extra });
        this.name = 'LLMError';
        this.statusCode = statusCode;
        this.provider = provider;
    }
}
export class RateLimitError extends LLMError {
    retryAfter;
    constructor(message = 'Rate limit exceeded', retryAfter, extra = {}) {
        super(message, undefined, undefined, { retryAfter, ...extra });
        this.name = 'RateLimitError';
        this.severity = ErrorSeverity.MEDIUM;
        this.retryAfter = retryAfter;
    }
}
export class FallbackError extends SummarizationError {
    attempts;
    constructor(message = 'All fallback strategies exhausted', attempts = 0, extra = {}) {
        super(message, ErrorSeverity.CRITICAL, { attempts, ...extra });
        this.name = 'FallbackError';
        this.attempts = attempts;
    }
}
export class ValidationError extends SummarizationError {
    field;
    constructor(message, field, extra = {}) {
        super(message, ErrorSeverity.LOW, { field, ...extra });
        this.name = 'ValidationError';
        this.field = field;
    }
}
export class TimeoutError extends SummarizationError {
    timeoutValue;
    constructor(message = 'Operation timed out', timeoutValue, extra = {}) {
        super(message, ErrorSeverity.MEDIUM, { timeout: timeoutValue, ...extra });
        this.name = 'TimeoutError';
        this.timeoutValue = timeoutValue;
    }
}
//# sourceMappingURL=errors.js.map