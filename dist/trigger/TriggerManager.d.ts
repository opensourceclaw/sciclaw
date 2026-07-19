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
import type { Trigger, TriggerType, TriggerResult, TriggerManagerConfig, ScheduleConfig, EventConfig, ManualConfig } from "./types.js";
/**
 * Lightweight trigger manager for DeepClaw.
 *
 * Design Decision: File-based (no external scheduler) because:
 * - DeepClaw is primarily interactive, not automated
 * - Cron-style scheduling is sufficient
 * - No external dependencies
 */
export declare class TriggerManager {
    private config;
    private triggers;
    private triggerDir;
    private schedulerInterval?;
    constructor(config?: Partial<TriggerManagerConfig>);
    /**
     * Register a new trigger.
     */
    register(name: string, type: TriggerType, config: ScheduleConfig | EventConfig | ManualConfig): Trigger;
    /**
     * Unregister a trigger.
     */
    unregister(triggerId: string): boolean;
    /**
     * Get trigger by ID.
     */
    get(triggerId: string): Trigger | undefined;
    /**
     * Get trigger by name.
     */
    getByName(name: string): Trigger | undefined;
    /**
     * List all triggers.
     */
    listAll(): Trigger[];
    /**
     * List triggers by type.
     */
    listByType(type: TriggerType): Trigger[];
    /**
     * Pause trigger.
     */
    pause(triggerId: string): boolean;
    /**
     * Resume trigger.
     */
    resume(triggerId: string): boolean;
    /**
     * Disable trigger.
     */
    disable(triggerId: string): boolean;
    /**
     * Execute a trigger manually.
     */
    execute(triggerId: string): Promise<TriggerResult>;
    /**
     * Execute trigger by name (for CLI).
     */
    executeByName(name: string): Promise<TriggerResult>;
    /**
     * Process due triggers (called by scheduler).
     */
    processDue(): Promise<TriggerResult[]>;
    /**
     * Start the scheduler (checks for due triggers periodically).
     */
    startScheduler(intervalMs?: number): void;
    /**
     * Stop the scheduler.
     */
    stopScheduler(): void;
    /**
     * Persist triggers to disk.
     */
    persist(): void;
    /**
     * Load triggers from disk.
     */
    load(): void;
    private ensureDir;
    /**
     * Calculate next run time from cron expression.
     * Simplified implementation: supports daily/hourly patterns only.
     */
    private calculateNextRun;
}
//# sourceMappingURL=TriggerManager.d.ts.map