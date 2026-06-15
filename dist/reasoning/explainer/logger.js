/**
 * Reasoning Logger - Records each step of the reasoning process
 */
const MAX_LOG_ENTRIES = 1000;
export class ReasoningLogger {
    buffer = [];
    maxEntries;
    constructor(maxEntries = MAX_LOG_ENTRIES) {
        this.maxEntries = maxEntries;
    }
    log(entry) {
        const logEntry = {
            ...entry,
            timestamp: new Date(),
        };
        if (this.buffer.length >= this.maxEntries) {
            this.buffer.shift();
        }
        this.buffer.push(logEntry);
        return logEntry;
    }
    info(stepNumber, subQuestion, input, output, reasoning, durationMs, confidence) {
        return this.log({
            stepNumber,
            subQuestion,
            input,
            output,
            reasoning,
            durationMs,
            confidence,
            level: 'info',
        });
    }
    warn(stepNumber, subQuestion, input, output, reasoning, durationMs, confidence) {
        return this.log({
            stepNumber,
            subQuestion,
            input,
            output,
            reasoning,
            durationMs,
            confidence,
            level: 'warn',
        });
    }
    error(stepNumber, subQuestion, input, output, reasoning, durationMs, confidence) {
        return this.log({
            stepNumber,
            subQuestion,
            input,
            output,
            reasoning,
            durationMs,
            confidence,
            level: 'error',
        });
    }
    getAll() {
        return [...this.buffer];
    }
    getByLevel(level) {
        return this.buffer.filter((e) => e.level === level);
    }
    getRecent(count) {
        return this.buffer.slice(-count);
    }
    clear() {
        this.buffer = [];
    }
    toJSON() {
        return JSON.stringify(this.buffer, null, 2);
    }
    get size() {
        return this.buffer.length;
    }
}
//# sourceMappingURL=logger.js.map