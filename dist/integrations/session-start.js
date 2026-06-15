/**
 * Research Session Start Hook
 *
 * Injects memory context and learned preferences into DeepClaw research sessions.
 */
export class ResearchSessionStartHook {
    workspace;
    constructor(workspace) {
        this.workspace = workspace ?? process.cwd();
    }
    run(scenario = 'research', _options = {}) {
        if (scenario === 'research') {
            return '## Related Memories\n\nNo relevant memories found.\n\n---';
        }
        return '';
    }
    getStatus() {
        return {
            workspace: this.workspace,
        };
    }
    getSessionInjectionPath() {
        return `${this.workspace}/data/deepclaw/injections`;
    }
}
//# sourceMappingURL=session-start.js.map