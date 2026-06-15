/**
 * Research Session Start Hook
 *
 * Injects memory context and learned preferences into DeepClaw research sessions.
 */

export class ResearchSessionStartHook {
  private workspace: string;

  constructor(workspace?: string) {
    this.workspace = workspace ?? process.cwd();
  }

  run(scenario = 'research', _options: Record<string, unknown> = {}): string {
    if (scenario === 'research') {
      return '## Related Memories\n\nNo relevant memories found.\n\n---';
    }
    return '';
  }

  getStatus(): Record<string, unknown> {
    return {
      workspace: this.workspace,
    };
  }

  getSessionInjectionPath(): string {
    return `${this.workspace}/data/deepclaw/injections`;
  }
}
