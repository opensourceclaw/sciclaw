/**
 * Retry Logic for Content Extraction
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
import { AxiosError } from 'axios';
export const defaultRetryConfig = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    exponentialBase: 2,
    jitter: true,
};
/**
 * Base exception for extraction errors
 */
export class ExtractionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ExtractionError';
    }
}
/**
 * Network-related errors
 */
export class NetworkError extends ExtractionError {
    constructor(message) {
        super(message);
        this.name = 'NetworkError';
    }
}
/**
 * Parsing-related errors
 */
export class ParseError extends ExtractionError {
    constructor(message) {
        super(message);
        this.name = 'ParseError';
    }
}
/**
 * Rate limit exceeded
 */
export class RateLimitError extends ExtractionError {
    constructor(message) {
        super(message);
        this.name = 'RateLimitError';
    }
}
/**
 * Request timeout
 */
export class TimeoutError extends ExtractionError {
    constructor(message) {
        super(message);
        this.name = 'TimeoutError';
    }
}
/**
 * Errors that can be retried
 */
export class RetryableError extends ExtractionError {
    constructor(message) {
        super(message);
        this.name = 'RetryableError';
    }
}
/**
 * Check if an error is retryable
 */
export function isRetryableError(error) {
    // Axios network errors
    if (error instanceof AxiosError) {
        const status = error.response?.status;
        // 429 Too Many Requests, 500-599 Server Errors
        if (status && [429, 500, 502, 503, 504].includes(status)) {
            return true;
        }
        // Network errors (no response)
        if (!error.response) {
            return true;
        }
    }
    // Custom retryable errors
    if (error instanceof RetryableError || error instanceof RateLimitError) {
        return true;
    }
    // Check error code for network issues
    const networkErrorCodes = ['ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNREFUSED'];
    if (networkErrorCodes.includes(error.code || '')) {
        return true;
    }
    return false;
}
/**
 * Calculate delay before next retry
 */
export function calculateDelay(attempt, config) {
    let delay = config.initialDelay * Math.pow(config.exponentialBase, attempt);
    delay = Math.min(delay, config.maxDelay);
    if (config.jitter) {
        // Add random jitter (±25%)
        const jitterAmount = delay * 0.25;
        delay = delay + (Math.random() * 2 - 1) * jitterAmount;
    }
    return Math.max(0, delay);
}
/**
 * Sleep utility
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff(fn, options = {}) {
    const config = {
        maxAttempts: options.maxAttempts ?? defaultRetryConfig.maxAttempts,
        initialDelay: options.initialDelay ?? defaultRetryConfig.initialDelay,
        maxDelay: options.maxDelay ?? defaultRetryConfig.maxDelay,
        exponentialBase: options.exponentialBase ?? defaultRetryConfig.exponentialBase,
        jitter: options.jitter ?? defaultRetryConfig.jitter,
    };
    let lastError;
    for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            // Don't retry on last attempt
            if (attempt >= config.maxAttempts - 1) {
                break;
            }
            // Check if error is retryable
            if (!isRetryableError(lastError)) {
                break;
            }
            // Calculate delay
            const delay = calculateDelay(attempt, config);
            console.warn(`Attempt ${attempt + 1}/${config.maxAttempts} failed: ${lastError.message}. ` +
                `Retrying in ${(delay / 1000).toFixed(2)}s...`);
            // Call onRetry callback
            if (options.onRetry) {
                options.onRetry(lastError, attempt + 1);
            }
            await sleep(delay);
        }
    }
    throw lastError || new ExtractionError('All retry attempts failed');
}
/**
 * Extract content with retry logic
 */
export async function extractWithRetry(extractorFunc, config = {}) {
    const fullConfig = { ...defaultRetryConfig, ...config };
    const startTime = Date.now();
    let lastError;
    for (let attempt = 0; attempt < fullConfig.maxAttempts; attempt++) {
        try {
            const content = await extractorFunc();
            const duration = Date.now() - startTime;
            return {
                success: true,
                content,
                attempts: attempt + 1,
                duration,
            };
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            // Don't retry on last attempt
            if (attempt >= fullConfig.maxAttempts - 1) {
                break;
            }
            // Check if retryable
            if (!isRetryableError(lastError)) {
                break;
            }
            const delay = calculateDelay(attempt, fullConfig);
            console.warn(`Extraction attempt ${attempt + 1} failed: ${lastError.message}. Retrying...`);
            await sleep(delay);
        }
    }
    // Failed
    const duration = Date.now() - startTime;
    return {
        success: false,
        error: lastError?.message || 'Unknown error',
        attempts: fullConfig.maxAttempts,
        duration,
    };
}
/**
 * Simple retry function (alias for retryWithBackoff)
 * Provides backward compatibility with existing tests
 * Note: This version retries all errors, not just retryable ones
 */
export async function retry(fn, options) {
    const config = {
        maxAttempts: options?.maxAttempts ?? defaultRetryConfig.maxAttempts,
        initialDelay: options?.initialDelay ?? options?.delay ?? 100,
        maxDelay: options?.maxDelay ?? defaultRetryConfig.maxDelay,
        exponentialBase: options?.exponentialBase ?? defaultRetryConfig.exponentialBase,
        jitter: options?.jitter ?? false,
    };
    let lastError;
    for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            // Don't retry on last attempt
            if (attempt >= config.maxAttempts - 1) {
                break;
            }
            // Simple retry: retry all errors (for backward compatibility)
            const delay = config.initialDelay;
            await sleep(delay);
        }
    }
    throw lastError || new Error('All retry attempts failed');
}
// Export all
export default {
    RetryConfig: defaultRetryConfig,
    ExtractionError,
    NetworkError,
    ParseError,
    RateLimitError,
    TimeoutError,
    RetryableError,
    isRetryableError,
    calculateDelay,
    retryWithBackoff,
    extractWithRetry,
};
//# sourceMappingURL=retry.js.map