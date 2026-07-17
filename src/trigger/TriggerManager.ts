/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Copyright 2026 Peter Cheng
// DeepClaw v3.5.0 — Trigger Manager

import type {
  Trigger,
  TriggerType,
  TriggerStatus,
  TriggerResult,
  TriggerManagerConfig,
  ScheduleConfig,
  EventConfig,
  ManualConfig,
} from "./types.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";

const DEFAULT_TRIGGER_DIR = path.join(os.homedir(), ".deepclaw", "triggers");

/**
 * Lightweight trigger manager for DeepClaw.
 *
 * Design Decision: File-based (no external scheduler) because:
 * - DeepClaw is primarily interactive, not automated
 * - Cron-style scheduling is sufficient
 * - No external dependencies
 */
export class TriggerManager {
  private config: Required<TriggerManagerConfig>;
  private triggers: Map<string, Trigger> = new Map();
  private triggerDir: string;
  private schedulerInterval?: ReturnType<typeof setInterval>;

  constructor(config?: Partial<TriggerManagerConfig>) {
    this.config = {
      triggerDir: config?.triggerDir ?? DEFAULT_TRIGGER_DIR,
      maxConcurrent: config?.maxConcurrent ?? 5,
      defaultRetries: config?.defaultRetries ?? 3,
    };
    this.triggerDir = this.config.triggerDir;
    this.ensureDir();
    this.load();
  }

  // ── Registration ────────────────────────────────────────────────────

  /**
   * Register a new trigger.
   */
  register(
    name: string,
    type: TriggerType,
    config: ScheduleConfig | EventConfig | ManualConfig
  ): Trigger {
    const id = `trigger-${crypto.randomUUID().slice(0, 8)}`;

    const trigger: Trigger = {
      id,
      name,
      type,
      status: "active",
      createdAt: new Date().toISOString(),
      runCount: 0,
      config,
    };

    // Calculate next run for schedule triggers
    if (type === "schedule") {
      trigger.nextRunAt = this.calculateNextRun((config as ScheduleConfig).cron);
    }

    this.triggers.set(id, trigger);
    this.persist();

    return trigger;
  }

  /**
   * Unregister a trigger.
   */
  unregister(triggerId: string): boolean {
    const deleted = this.triggers.delete(triggerId);
    if (deleted) {
      this.persist();
    }
    return deleted;
  }

  /**
   * Get trigger by ID.
   */
  get(triggerId: string): Trigger | undefined {
    return this.triggers.get(triggerId);
  }

  /**
   * Get trigger by name.
   */
  getByName(name: string): Trigger | undefined {
    for (const trigger of this.triggers.values()) {
      if (trigger.name === name) {
        return trigger;
      }
    }
    return undefined;
  }

  /**
   * List all triggers.
   */
  listAll(): Trigger[] {
    return [...this.triggers.values()];
  }

  /**
   * List triggers by type.
   */
  listByType(type: TriggerType): Trigger[] {
    return [...this.triggers.values()].filter((t) => t.type === type);
  }

  // ── Status Management ────────────────────────────────────────────────

  /**
   * Pause trigger.
   */
  pause(triggerId: string): boolean {
    const trigger = this.triggers.get(triggerId);
    if (trigger) {
      trigger.status = "paused";
      this.persist();
      return true;
    }
    return false;
  }

  /**
   * Resume trigger.
   */
  resume(triggerId: string): boolean {
    const trigger = this.triggers.get(triggerId);
    if (trigger) {
      trigger.status = "active";
      this.persist();
      return true;
    }
    return false;
  }

  /**
   * Disable trigger.
   */
  disable(triggerId: string): boolean {
    const trigger = this.triggers.get(triggerId);
    if (trigger) {
      trigger.status = "disabled";
      this.persist();
      return true;
    }
    return false;
  }

  // ── Execution ─────────────────────────────────────────────────────────

  /**
   * Execute a trigger manually.
   */
  async execute(triggerId: string): Promise<TriggerResult> {
    const trigger = this.triggers.get(triggerId);
    if (!trigger) {
      return {
        triggerId,
        executedAt: new Date().toISOString(),
        success: false,
        error: "Trigger not found",
      };
    }

    if (trigger.status === "disabled") {
      return {
        triggerId,
        executedAt: new Date().toISOString(),
        success: false,
        error: "Trigger is disabled",
      };
    }

    try {
      // Get topic from config
      const topic = (trigger.config as ScheduleConfig | EventConfig | ManualConfig).topic;

      // Simulate pipeline creation (actual integration with PipelineCoordinator in future)
      const pipelineId = `pipeline-${crypto.randomUUID().slice(0, 8)}`;

      // Update trigger state
      trigger.lastRunAt = new Date().toISOString();
      trigger.runCount++;

      if (trigger.type === "schedule") {
        trigger.nextRunAt = this.calculateNextRun((trigger.config as ScheduleConfig).cron);
      }

      this.persist();

      return {
        triggerId,
        executedAt: trigger.lastRunAt,
        success: true,
        pipelineId,
      };
    } catch (err) {
      return {
        triggerId,
        executedAt: new Date().toISOString(),
        success: false,
        error: (err as Error).message,
      };
    }
  }

  /**
   * Execute trigger by name (for CLI).
   */
  async executeByName(name: string): Promise<TriggerResult> {
    const trigger = this.getByName(name);
    if (!trigger) {
      return {
        triggerId: "unknown",
        executedAt: new Date().toISOString(),
        success: false,
        error: `Trigger not found: ${name}`,
      };
    }
    return this.execute(trigger.id);
  }

  /**
   * Process due triggers (called by scheduler).
   */
  async processDue(): Promise<TriggerResult[]> {
    const results: TriggerResult[] = [];
    const now = Date.now();

    for (const trigger of this.triggers.values()) {
      if (trigger.status !== "active") continue;
      if (trigger.type !== "schedule") continue;

      const nextRun = trigger.nextRunAt ? new Date(trigger.nextRunAt).getTime() : 0;
      if (nextRun <= now) {
        const result = await this.execute(trigger.id);
        results.push(result);
      }
    }

    return results;
  }

  // ── Scheduler ─────────────────────────────────────────────────────────

  /**
   * Start the scheduler (checks for due triggers periodically).
   */
  startScheduler(intervalMs?: number): void {
    if (this.schedulerInterval) {
      this.stopScheduler();
    }

    const interval = intervalMs ?? 60000; // Default: 1 minute
    this.schedulerInterval = setInterval(() => {
      this.processDue().catch(() => {
        // Scheduler errors are non-blocking
      });
    }, interval);
  }

  /**
   * Stop the scheduler.
   */
  stopScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = undefined;
    }
  }

  // ── Persistence ───────────────────────────────────────────────────────

  /**
   * Persist triggers to disk.
   */
  persist(): void {
    try {
      const filePath = path.join(this.triggerDir, "triggers.json");
      const data = JSON.stringify(
        { triggers: Object.fromEntries(this.triggers) },
        null,
        2
      );
      fs.writeFileSync(filePath, data, "utf-8");
    } catch {
      // Persistence failure is non-blocking
    }
  }

  /**
   * Load triggers from disk.
   */
  load(): void {
    try {
      const filePath = path.join(this.triggerDir, "triggers.json");
      if (!fs.existsSync(filePath)) return;

      const data = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(data);

      if (parsed.triggers && typeof parsed.triggers === "object") {
        for (const [id, trigger] of Object.entries(parsed.triggers)) {
          this.triggers.set(id, trigger as Trigger);
        }
      }
    } catch {
      // Load failure is non-blocking — start with empty state
    }
  }

  // ── Private Helpers ──────────────────────────────────────────────────

  private ensureDir(): void {
    if (!fs.existsSync(this.triggerDir)) {
      fs.mkdirSync(this.triggerDir, { recursive: true });
    }
  }

  /**
   * Calculate next run time from cron expression.
   * Simplified implementation: supports daily/hourly patterns only.
   */
  private calculateNextRun(cron: string): string {
    const parts = cron.split(" ");
    if (parts.length !== 5) {
      // Invalid cron — default to 1 hour from now
      return new Date(Date.now() + 3600000).toISOString();
    }

    const minute = parts[0]!;
    const hour = parts[1]!;
    const now = new Date();
    const next = new Date();

    // Parse minute
    if (minute === "*") {
      next.setMinutes(next.getMinutes() + 1);
    } else if (minute.startsWith("*/")) {
      const interval = parseInt(minute.slice(2), 10);
      next.setMinutes(Math.ceil(next.getMinutes() / interval) * interval);
    } else {
      next.setMinutes(parseInt(minute, 10));
    }

    // Parse hour
    if (hour !== "*" && !hour.startsWith("*/")) {
      next.setHours(parseInt(hour, 10));
    }

    // If time has passed, add a day
    if (next.getTime() <= now.getTime()) {
      next.setDate(next.getDate() + 1);
    }

    return next.toISOString();
  }
}
