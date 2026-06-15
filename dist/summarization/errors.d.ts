/**
 * Error handling for summarization module
 */
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare class SummarizationError extends Error {
    severity: ErrorSeverity;
    details: Record<string, unknown>;
    originalError?: Error;
    constructor(message: string, severity?: ErrorSeverity, details?: Record<string, unknown>, originalError?: Error);
}
export declare class LLMError extends SummarizationError {
    statusCode?: number;
    provider?: string;
    constructor(message: string, statusCode?: number, provider?: string, extra?: Record<string, unknown>);
}
export declare class RateLimitError extends LLMError {
    retryAfter?: number;
    constructor(message?: string, retryAfter?: number, extra?: Record<string, unknown>);
}
export declare class FallbackError extends SummarizationError {
    attempts: number;
    constructor(message?: string, attempts?: number, extra?: Record<string, unknown>);
}
export declare class ValidationError extends SummarizationError {
    field?: string;
    constructor(message: string, field?: string, extra?: Record<string, unknown>);
}
export declare class TimeoutError extends SummarizationError {
    timeoutValue?: number;
    constructor(message?: string, timeoutValue?: number, extra?: Record<string, unknown>);
}
//# sourceMappingURL=errors.d.ts.map