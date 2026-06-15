/**
 * Retry utilities
 */
export async function retry(fn, options = {}) {
    const maxAttempts = options.maxAttempts ?? 3;
    const delay = options.delay ?? 1000;
    const backoff = options.backoff ?? 2;
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt < maxAttempts) {
                await sleep(delay * Math.pow(backoff, attempt - 1));
            }
        }
    }
    throw lastError;
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=retry.js.map