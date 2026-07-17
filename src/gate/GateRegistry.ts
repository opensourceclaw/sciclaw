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
// DeepClaw v3.5.0 — Gate Registry

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import type { GateState, GateStatus, ValidationResult } from "./types.js";

export type StatusChangeCallback = (gateId: string, oldStatus: GateStatus, newStatus: GateStatus) => void;

const DEFAULT_GATES_DIR = path.join(os.homedir(), ".deepclaw", "gates");

export class GateRegistry {
  private gates: Map<string, GateState> = new Map();
  private listeners: StatusChangeCallback[] = [];
  private gatesDir: string;

  constructor(gatesDir?: string) {
    this.gatesDir = gatesDir ?? DEFAULT_GATES_DIR;
    this.restore();
  }

  getGateStatus(gateId: string): GateStatus {
    return this.gates.get(gateId)?.status ?? "pending";
  }

  setGateStatus(gateId: string, status: GateStatus, metadata?: Record<string, unknown>): void {
    const oldStatus = this.getGateStatus(gateId);
    const state: GateState = {
      gateId,
      status,
      timestamp: Date.now(),
      metadata: metadata ?? {},
    };
    this.gates.set(gateId, state);
    this.persist();

    if (oldStatus !== status) {
      for (const listener of this.listeners) {
        try {
          listener(gateId, oldStatus, status);
        } catch {
          // Listener failure is non-blocking
        }
      }
    }
  }

  validateAllGates(): ValidationResult {
    const failedGates: string[] = [];
    const warnings: string[] = [];

    for (const [gateId, state] of this.gates) {
      if (state.status === "failed" || state.status === "blocked") {
        failedGates.push(gateId);
      } else if (state.status === "pending") {
        warnings.push(`Gate ${gateId} is still pending`);
      }
    }

    return {
      allPassed: failedGates.length === 0,
      failedGates,
      warnings,
    };
  }

  onStatusChange(callback: StatusChangeCallback): void {
    this.listeners.push(callback);
  }

  getAllGates(): GateState[] {
    return Array.from(this.gates.values());
  }

  reset(): void {
    this.gates.clear();
    this.persist();
  }

  // ── Persistence ─────────────────────────────────────────────────

  private persist(): void {
    try {
      if (!fs.existsSync(this.gatesDir)) {
        fs.mkdirSync(this.gatesDir, { recursive: true });
      }
      const data = JSON.stringify(
        { gates: Object.fromEntries(this.gates) },
        null,
        2
      );
      fs.writeFileSync(path.join(this.gatesDir, "gates.json"), data, "utf-8");
    } catch {
      // Persistence failure is non-blocking
    }
  }

  private restore(): void {
    try {
      const filePath = path.join(this.gatesDir, "gates.json");
      if (!fs.existsSync(filePath)) return;

      const data = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(data);
      if (parsed.gates && typeof parsed.gates === "object") {
        for (const [gateId, state] of Object.entries(parsed.gates)) {
          this.gates.set(gateId, state as GateState);
        }
      }
    } catch {
      // Restore failure is non-blocking — start with empty state
    }
  }
}
