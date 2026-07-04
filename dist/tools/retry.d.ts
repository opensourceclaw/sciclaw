/**
 * Retry Logic for Content Extraction
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    exponentialBase: number;
    jitter: boolean;
}
export declare const defaultRetryConfig: RetryConfig;
/**
 * Base exception for extraction errors
 */
export declare class ExtractionError extends Error {
    constructor(message: string);
}
/**
 * Network-related errors
 */
export declare class NetworkError extends ExtractionError {
    constructor(message: string);
}
/**
 * Parsing-related errors
 */
export declare class ParseError extends ExtractionError {
    constructor(message: string);
}
/**
 * Rate limit exceeded
 */
export declare class RateLimitError extends ExtractionError {
    constructor(message: string);
}
/**
 * Request timeout
 */
export declare class TimeoutError extends ExtractionError {
    constructor(message: string);
}
/**
 * Errors that can be retried
 */
export declare class RetryableError extends ExtractionError {
    constructor(message: string);
}
/**
 * Check if an error is retryable
 */
export declare function isRetryableError(error: Error): boolean;
/**
 * Calculate delay before next retry
 */
export declare function calculateDelay(attempt: number, config: RetryConfig): number;
/**
 * Retry options for async functions
 */
export interface RetryOptions {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    exponentialBase?: number;
    jitter?: boolean;
    onRetry?: (error: Error, attempt: number) => void;
}
/**
 * Retry a function with exponential backoff
 */
export declare function retryWithBackoff<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
/**
 * Result of an extraction operation
 */
export interface ExtractionResult<T = unknown> {
    success: boolean;
    content?: T;
    error?: string;
    attempts: number;
    duration: number;
}
/**
 * Extract content with retry logic
 */
export declare function extractWithRetry<T>(extractorFunc: () => Promise<T>, config?: Partial<RetryConfig>): Promise<ExtractionResult<T>>;
/**
 * Simple retry function (alias for retryWithBackoff)
 * Provides backward compatibility with existing tests
 * Note: This version retries all errors, not just retryable ones
 */
export declare function retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
declare const _default: {
    RetryConfig: RetryConfig;
    ExtractionError: typeof ExtractionError;
    NetworkError: typeof NetworkError;
    ParseError: typeof ParseError;
    RateLimitError: typeof RateLimitError;
    TimeoutError: typeof TimeoutError;
    RetryableError: typeof RetryableError;
    isRetryableError: typeof isRetryableError;
    calculateDelay: typeof calculateDelay;
    retryWithBackoff: typeof retryWithBackoff;
    extractWithRetry: typeof extractWithRetry;
};
export default _default;
//# sourceMappingURL=retry.d.ts.map