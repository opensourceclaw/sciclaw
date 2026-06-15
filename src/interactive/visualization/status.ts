/**
 * Status Display - Shows current status information
 */

import type { ResearchStatus, StatusUpdate } from './types.js';

export class StatusDisplay {
  private updates: StatusUpdate[] = [];

  record(status: ResearchStatus, message: string, detail?: string): StatusUpdate {
    const update: StatusUpdate = {
      status,
      message,
      timestamp: new Date(),
      detail,
    };
    this.updates.push(update);
    return update;
  }

  getLatest(): StatusUpdate | null {
    return this.updates.length > 0 ? this.updates[this.updates.length - 1]! : null;
  }

  getHistory(limit?: number): StatusUpdate[] {
    if (limit && limit > 0) {
      return this.updates.slice(-limit);
    }
    return [...this.updates];
  }

  format(): string {
    return this.updates
      .map((u) => {
        const time = u.timestamp.toISOString().slice(11, 19);
        let line = `[${time}] ${u.status}: ${u.message}`;
        if (u.detail) line += `\n  ${u.detail}`;
        return line;
      })
      .join('\n');
  }

  summarize(): string {
    if (this.updates.length === 0) return 'No status updates.';

    const latest = this.getLatest()!;
    const completedCount = this.updates.filter((u) => u.status === 'completed').length;
    const errorCount = this.updates.filter((u) => u.status === 'error').length;

    return `Status: ${latest.status} | Total updates: ${this.updates.length} | Completed: ${completedCount} | Errors: ${errorCount}`;
  }
}
