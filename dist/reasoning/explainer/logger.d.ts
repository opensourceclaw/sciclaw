/**
 * Reasoning Logger - Records each step of the reasoning process
 */
import type { LogEntry } from './types.js';
export declare class ReasoningLogger {
    private buffer;
    private maxEntries;
    constructor(maxEntries?: number);
    log(entry: Omit<LogEntry, 'timestamp'>): LogEntry;
    info(stepNumber: number, subQuestion: string, input: unknown, output: unknown, reasoning: string, durationMs: number, confidence: number): LogEntry;
    warn(stepNumber: number, subQuestion: string, input: unknown, output: unknown, reasoning: string, durationMs: number, confidence: number): LogEntry;
    error(stepNumber: number, subQuestion: string, input: unknown, output: unknown, reasoning: string, durationMs: number, confidence: number): LogEntry;
    getAll(): LogEntry[];
    getByLevel(level: LogEntry['level']): LogEntry[];
    getRecent(count: number): LogEntry[];
    clear(): void;
    toJSON(): string;
    get size(): number;
}
//# sourceMappingURL=logger.d.ts.map