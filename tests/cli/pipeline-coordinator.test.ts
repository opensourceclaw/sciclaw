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
// SciClaw v3.5.0 — Pipeline Coordinator Tests

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { PipelineCoordinator } from "../../src/cli/pipeline-coordinator.js";
import { PipelineStage } from "../../src/cli/types.js";

describe("PipelineCoordinator", () => {
  let tmpDir: string;
  let coordinator: PipelineCoordinator;

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), `deepclaw-pipeline-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    coordinator = new PipelineCoordinator(tmpDir);
  });

  afterEach(() => {
    try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
  });

  describe("create", () => {
    it("creates a new pipeline", () => {
      const state = coordinator.create("Test topic");
      expect(state.id).toBeDefined();
      expect(state.topic).toBe("Test topic");
      expect(state.status).toBe("pending");
      expect(state.currentStage).toBe(PipelineStage.PLAN);
    });

    it("creates pipeline with 5 stages", () => {
      const state = coordinator.create("Test");
      expect(state.stages).toHaveLength(5);
    });
  });

  describe("get", () => {
    it("retrieves created pipeline", () => {
      const created = coordinator.create("Test");
      const retrieved = coordinator.get(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.topic).toBe("Test");
    });

    it("returns null for non-existent pipeline", () => {
      expect(coordinator.get("non-existent")).toBeNull();
    });
  });

  describe("start", () => {
    it("starts a pipeline", () => {
      const state = coordinator.create("Test");
      const started = coordinator.start(state.id);
      expect(started?.status).toBe("running");
    });
  });

  describe("advance", () => {
    it("advances to next stage", () => {
      const state = coordinator.create("Test");
      coordinator.start(state.id);
      const advanced = coordinator.advance(state.id);
      expect(advanced?.currentStage).toBe(PipelineStage.SEARCH);
    });

    it("completes pipeline after all stages", () => {
      const state = coordinator.create("Test");
      coordinator.start(state.id);
      coordinator.advance(state.id); // PLAN -> SEARCH
      coordinator.advance(state.id); // SEARCH -> SYNTHESIZE
      coordinator.advance(state.id); // SYNTHESIZE -> WRITE
      coordinator.advance(state.id); // WRITE -> VERIFY
      coordinator.advance(state.id); // VERIFY -> completed
      const final = coordinator.get(state.id);
      expect(final?.status).toBe("completed");
    });
  });

  describe("approve", () => {
    it("approves and advances stage", () => {
      const state = coordinator.create("Test");
      coordinator.start(state.id);
      const approved = coordinator.approve(state.id, PipelineStage.PLAN);
      expect(approved?.currentStage).toBe(PipelineStage.SEARCH);
    });

    it("throws on wrong stage", () => {
      const state = coordinator.create("Test");
      expect(() => coordinator.approve(state.id, PipelineStage.SEARCH)).toThrow();
    });
  });

  describe("fail", () => {
    it("marks pipeline as failed", () => {
      const state = coordinator.create("Test");
      const failed = coordinator.fail(state.id, "Test error");
      expect(failed?.status).toBe("failed");
    });
  });

  describe("delete", () => {
    it("deletes a pipeline", () => {
      const state = coordinator.create("Test");
      expect(coordinator.delete(state.id)).toBe(true);
      expect(coordinator.get(state.id)).toBeNull();
    });
  });

  describe("listAll", () => {
    it("lists all pipelines", () => {
      coordinator.create("Test 1");
      coordinator.create("Test 2");
      const list = coordinator.listAll();
      expect(list).toHaveLength(2);
    });
  });

  describe("getLatest", () => {
    it("gets most recent pipeline", async () => {
      coordinator.create("First");
      await new Promise(r => setTimeout(r, 10)); // Ensure different timestamp
      coordinator.create("Second");
      const latest = coordinator.getLatest();
      expect(latest?.topic).toBe("Second");
    });
  });
});
