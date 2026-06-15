/**
 * Status Display - Shows current status information
 */
export class StatusDisplay {
    updates = [];
    record(status, message, detail) {
        const update = {
            status,
            message,
            timestamp: new Date(),
            detail,
        };
        this.updates.push(update);
        return update;
    }
    getLatest() {
        return this.updates.length > 0 ? this.updates[this.updates.length - 1] : null;
    }
    getHistory(limit) {
        if (limit && limit > 0) {
            return this.updates.slice(-limit);
        }
        return [...this.updates];
    }
    format() {
        return this.updates
            .map((u) => {
            const time = u.timestamp.toISOString().slice(11, 19);
            let line = `[${time}] ${u.status}: ${u.message}`;
            if (u.detail)
                line += `\n  ${u.detail}`;
            return line;
        })
            .join('\n');
    }
    summarize() {
        if (this.updates.length === 0)
            return 'No status updates.';
        const latest = this.getLatest();
        const completedCount = this.updates.filter((u) => u.status === 'completed').length;
        const errorCount = this.updates.filter((u) => u.status === 'error').length;
        return `Status: ${latest.status} | Total updates: ${this.updates.length} | Completed: ${completedCount} | Errors: ${errorCount}`;
    }
}
//# sourceMappingURL=status.js.map