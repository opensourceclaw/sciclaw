/**
 * Plugin module - OpenClaw plugin hooks for DeepClaw
 *
 * Provides hooks, lifecycle management, and command registration.
 */
export interface PluginParams {
    scenario?: string;
    topic?: string;
    query?: string;
    feedback?: string;
    action?: string;
    context?: string;
    findingsCount?: number;
    [key: string]: unknown;
}
export declare class DeepClawPluginHooks {
    private workspace;
    private initialized;
    constructor(workspace?: string);
    onLoad(): Record<string, unknown>;
    onUnload(): Record<string, unknown>;
    onSessionStart(params: PluginParams): string;
    onSessionEnd(_params: PluginParams): Record<string, unknown>;
    onFeedback(params: PluginParams): Record<string, unknown>;
    getStatus(): Record<string, unknown>;
}
export declare function registerHooks(workspace?: string): DeepClawPluginHooks;
//# sourceMappingURL=index.d.ts.map