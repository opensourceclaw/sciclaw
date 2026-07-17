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
// DeepClaw v3.5.0 — Trigger Types

// ── Trigger Types ────────────────────────────────────────────────────

/** Trigger type */
export type TriggerType = "schedule" | "event" | "manual";

/** Trigger status */
export type TriggerStatus = "active" | "paused" | "disabled";

/** Trigger definition */
export interface Trigger {
  id: string;
  name: string;
  type: TriggerType;
  status: TriggerStatus;
  createdAt: string;
  lastRunAt?: string;
  nextRunAt?: string;
  runCount: number;
  config: ScheduleConfig | EventConfig | ManualConfig;
}

/** Schedule trigger config (cron-based) */
export interface ScheduleConfig {
  cron: string;
  topic: string;
  sources?: string[];
  maxRetries?: number;
}

/** Event trigger config */
export interface EventConfig {
  event: "on_failure" | "on_success" | "on_timeout";
  topic: string;
  sources?: string[];
  cooldown?: number;
}

/** Manual trigger config */
export interface ManualConfig {
  topic: string;
  sources?: string[];
}

/** Trigger execution result */
export interface TriggerResult {
  triggerId: string;
  executedAt: string;
  success: boolean;
  pipelineId?: string;
  error?: string;
}

/** Trigger manager config */
export interface TriggerManagerConfig {
  triggerDir?: string;
  maxConcurrent?: number;
  defaultRetries?: number;
}
