/**
 * Reasoning Logger - Records each step of the reasoning process
 */

import type { LogEntry } from './types.js';

const MAX_LOG_ENTRIES = 1000;

export class ReasoningLogger {
  private buffer: LogEntry[] = [];
  private maxEntries: number;

  constructor(maxEntries: number = MAX_LOG_ENTRIES) {
    this.maxEntries = maxEntries;
  }

  log(entry: Omit<LogEntry, 'timestamp'>): LogEntry {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date(),
    };

    if (this.buffer.length >= this.maxEntries) {
      this.buffer.shift();
    }

    this.buffer.push(logEntry);
    return logEntry;
  }

  info(
    stepNumber: number,
    subQuestion: string,
    input: unknown,
    output: unknown,
    reasoning: string,
    durationMs: number,
    confidence: number,
  ): LogEntry {
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

  warn(
    stepNumber: number,
    subQuestion: string,
    input: unknown,
    output: unknown,
    reasoning: string,
    durationMs: number,
    confidence: number,
  ): LogEntry {
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

  error(
    stepNumber: number,
    subQuestion: string,
    input: unknown,
    output: unknown,
    reasoning: string,
    durationMs: number,
    confidence: number,
  ): LogEntry {
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

  getAll(): LogEntry[] {
    return [...this.buffer];
  }

  getByLevel(level: LogEntry['level']): LogEntry[] {
    return this.buffer.filter((e) => e.level === level);
  }

  getRecent(count: number): LogEntry[] {
    return this.buffer.slice(-count);
  }

  clear(): void {
    this.buffer = [];
  }

  toJSON(): string {
    return JSON.stringify(this.buffer, null, 2);
  }

  get size(): number {
    return this.buffer.length;
  }
}
