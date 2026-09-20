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
// SciClaw v3.5.0 - TriggerManager Tests

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { TriggerManager } from "../../src/trigger/TriggerManager.js";
import type { ScheduleConfig, EventConfig, ManualConfig } from "../../src/trigger/types.js";

describe("TriggerManager", () => {
  let tmpDir: string;
  let manager: TriggerManager;

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), `deepclaw-trigger-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    manager = new TriggerManager({ triggerDir: tmpDir });
  });

  afterEach(() => {
    manager.stopScheduler();
    try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
  });

  describe("registration", () => {
    it("registers a schedule trigger", () => {
      const config: ScheduleConfig = {
        cron: "0 9 * * *",
        topic: "AI Safety",
      };

      const trigger = manager.register("daily-research", "schedule", config);

      expect(trigger.id).toBeDefined();
      expect(trigger.name).toBe("daily-research");
      expect(trigger.type).toBe("schedule");
      expect(trigger.status).toBe("active");
      expect(trigger.nextRunAt).toBeDefined();
    });

    it("registers an event trigger", () => {
      const config: EventConfig = {
        event: "on_failure",
        topic: "Retry topic",
      };

      const trigger = manager.register("retry-on-fail", "event", config);

      expect(trigger.type).toBe("event");
      expect(trigger.status).toBe("active");
    });

    it("registers a manual trigger", () => {
      const config: ManualConfig = {
        topic: "Manual research",
      };

      const trigger = manager.register("manual-run", "manual", config);

      expect(trigger.type).toBe("manual");
    });

    it("unregisters a trigger", () => {
      const trigger = manager.register("test", "manual", { topic: "Test" });
      expect(manager.unregister(trigger.id)).toBe(true);
      expect(manager.get(trigger.id)).toBeUndefined();
    });
  });

  describe("status management", () => {
    it("pauses a trigger", () => {
      const trigger = manager.register("test", "manual", { topic: "Test" });
      expect(manager.pause(trigger.id)).toBe(true);
      expect(manager.get(trigger.id)?.status).toBe("paused");
    });

    it("resumes a trigger", () => {
      const trigger = manager.register("test", "manual", { topic: "Test" });
      manager.pause(trigger.id);
      expect(manager.resume(trigger.id)).toBe(true);
      expect(manager.get(trigger.id)?.status).toBe("active");
    });

    it("disables a trigger", () => {
      const trigger = manager.register("test", "manual", { topic: "Test" });
      expect(manager.disable(trigger.id)).toBe(true);
      expect(manager.get(trigger.id)?.status).toBe("disabled");
    });
  });

  describe("execution", () => {
    it("executes a trigger manually", async () => {
      const trigger = manager.register("test", "manual", { topic: "Test topic" });
      const result = await manager.execute(trigger.id);

      expect(result.success).toBe(true);
      expect(result.pipelineId).toBeDefined();
      expect(manager.get(trigger.id)?.runCount).toBe(1);
    });

    it("executes trigger by name", async () => {
      manager.register("my-trigger", "manual", { topic: "Test" });
      const result = await manager.executeByName("my-trigger");

      expect(result.success).toBe(true);
    });

    it("fails to execute disabled trigger", async () => {
      const trigger = manager.register("test", "manual", { topic: "Test" });
      manager.disable(trigger.id);

      const result = await manager.execute(trigger.id);
      expect(result.success).toBe(false);
      expect(result.error).toContain("disabled");
    });
  });

  describe("listing", () => {
    it("lists all triggers", () => {
      manager.register("t1", "manual", { topic: "T1" });
      manager.register("t2", "schedule", { cron: "0 9 * * *", topic: "T2" });

      const all = manager.listAll();
      expect(all.length).toBe(2);
    });

    it("lists triggers by type", () => {
      manager.register("m1", "manual", { topic: "M" });
      manager.register("s1", "schedule", { cron: "0 9 * * *", topic: "S" });

      const schedules = manager.listByType("schedule");
      expect(schedules.length).toBe(1);
      expect(schedules[0].type).toBe("schedule");
    });
  });

  describe("persistence", () => {
    it("persists triggers to disk", () => {
      manager.register("test", "manual", { topic: "Test" });

      const filePath = path.join(tmpDir, "triggers.json");
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("loads triggers from disk", () => {
      manager.register("test", "manual", { topic: "Test" });

      const newManager = new TriggerManager({ triggerDir: tmpDir });
      const triggers = newManager.listAll();

      expect(triggers.length).toBe(1);
      expect(triggers[0].name).toBe("test");
    });
  });
});
