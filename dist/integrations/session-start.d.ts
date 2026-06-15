/**
 * Research Session Start Hook
 *
 * Injects memory context and learned preferences into DeepClaw research sessions.
 */
export declare class ResearchSessionStartHook {
    private workspace;
    constructor(workspace?: string);
    run(scenario?: string, _options?: Record<string, unknown>): string;
    getStatus(): Record<string, unknown>;
    getSessionInjectionPath(): string;
}
//# sourceMappingURL=session-start.d.ts.map