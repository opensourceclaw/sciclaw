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

export class DeepClawPluginHooks {
  private workspace: string;
  private initialized = false;

  constructor(workspace?: string) {
    this.workspace = workspace ?? process.cwd();
  }

  onLoad(): Record<string, unknown> {
    return { status: 'loaded', plugin: 'deepclaw' };
  }

  onUnload(): Record<string, unknown> {
    this.initialized = false;
    return { status: 'unloaded' };
  }

  onSessionStart(params: PluginParams): string {
    this.initialized = true;
    const scenario = params.scenario ?? 'research';
    const topic = params.topic ?? '';
    return `DeepClaw session started. Scenario: ${scenario}, Topic: ${topic}`;
  }

  onSessionEnd(_params: PluginParams): Record<string, unknown> {
    return { status: 'ok' };
  }

  onFeedback(params: PluginParams): Record<string, unknown> {
    const feedback = params.feedback ?? '';
    if (!feedback) return { status: 'skipped', reason: 'no_feedback' };
    return { status: 'ok' };
  }

  getStatus(): Record<string, unknown> {
    return {
      initialized: this.initialized,
      workspace: this.workspace,
    };
  }
}

export function registerHooks(workspace?: string): DeepClawPluginHooks {
  return new DeepClawPluginHooks(workspace);
}
