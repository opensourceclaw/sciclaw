/**
 * Status Display - Shows current status information
 */
import type { ResearchStatus, StatusUpdate } from './types.js';
export declare class StatusDisplay {
    private updates;
    record(status: ResearchStatus, message: string, detail?: string): StatusUpdate;
    getLatest(): StatusUpdate | null;
    getHistory(limit?: number): StatusUpdate[];
    format(): string;
    summarize(): string;
}
//# sourceMappingURL=status.d.ts.map