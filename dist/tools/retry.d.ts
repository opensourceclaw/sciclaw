/**
 * Retry utilities
 */
export declare function retry<T>(fn: () => Promise<T>, options?: {
    maxAttempts?: number;
    delay?: number;
    backoff?: number;
}): Promise<T>;
//# sourceMappingURL=retry.d.ts.map