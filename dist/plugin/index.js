/**
 * Plugin module - OpenClaw plugin hooks for DeepClaw
 *
 * Provides hooks, lifecycle management, and command registration.
 */
export class DeepClawPluginHooks {
    workspace;
    initialized = false;
    constructor(workspace) {
        this.workspace = workspace ?? process.cwd();
    }
    onLoad() {
        return { status: 'loaded', plugin: 'deepclaw' };
    }
    onUnload() {
        this.initialized = false;
        return { status: 'unloaded' };
    }
    onSessionStart(params) {
        this.initialized = true;
        const scenario = params.scenario ?? 'research';
        const topic = params.topic ?? '';
        return `DeepClaw session started. Scenario: ${scenario}, Topic: ${topic}`;
    }
    onSessionEnd(_params) {
        return { status: 'ok' };
    }
    onFeedback(params) {
        const feedback = params.feedback ?? '';
        if (!feedback)
            return { status: 'skipped', reason: 'no_feedback' };
        return { status: 'ok' };
    }
    getStatus() {
        return {
            initialized: this.initialized,
            workspace: this.workspace,
        };
    }
}
export function registerHooks(workspace) {
    return new DeepClawPluginHooks(workspace);
}
//# sourceMappingURL=index.js.map