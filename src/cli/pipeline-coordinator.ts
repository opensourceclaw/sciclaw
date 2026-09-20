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
// SciClaw v3.5.0 — Pipeline Coordinator

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import type { PipelineState, PipelineConfig } from "./types.js";
import { PipelineStage, DEFAULT_PIPELINE_CONFIG } from "./types.js";

const PIPELINES_DIR = path.join(os.homedir(), ".deepclaw", "pipelines");

/**
 * PipelineCoordinator manages pipeline state and stage transitions.
 */
export class PipelineCoordinator {
  private pipelinesDir: string;

  constructor(pipelinesDir?: string) {
    this.pipelinesDir = pipelinesDir ?? PIPELINES_DIR;
    this.ensureDir();
  }

  /**
   * Create a new pipeline for a research topic.
   */
  create(topic: string, config?: Partial<PipelineConfig>): PipelineState {
    const id = `pipeline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = Date.now();

    const state: PipelineState = {
      id,
      topic,
      status: "pending",
      currentStage: PipelineStage.PLAN,
      createdAt: now,
      updatedAt: now,
      stages: [
        { stage: PipelineStage.PLAN, status: "pending" },
        { stage: PipelineStage.SEARCH, status: "pending" },
        { stage: PipelineStage.SYNTHESIZE, status: "pending" },
        { stage: PipelineStage.WRITE, status: "pending" },
        { stage: PipelineStage.VERIFY, status: "pending" },
      ],
    };

    this.save(state);
    return state;
  }

  /**
   * Get pipeline by ID.
   */
  get(id: string): PipelineState | null {
    const filePath = this.getFilePath(id);
    if (!fs.existsSync(filePath)) return null;

    try {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data) as PipelineState;
    } catch {
      return null;
    }
  }

  /**
   * Get the most recent pipeline.
   */
  getLatest(): PipelineState | null {
    const files = this.listFiles();
    if (files.length === 0) return null;

    const latest = files.sort().pop();
    if (!latest) return null;

    return this.get(latest);
  }

  /**
   * List all pipeline IDs.
   */
  listAll(): string[] {
    return this.listFiles();
  }

  /**
   * Start pipeline execution.
   */
  start(id: string): PipelineState | null {
    const state = this.get(id);
    if (!state) return null;

    state.status = "running";
    state.updatedAt = Date.now();
    this.save(state);
    return state;
  }

  /**
   * Advance to next stage.
   */
  advance(id: string): PipelineState | null {
    const state = this.get(id);
    if (!state) return null;

    const stageOrder = [
      PipelineStage.PLAN,
      PipelineStage.SEARCH,
      PipelineStage.SYNTHESIZE,
      PipelineStage.WRITE,
      PipelineStage.VERIFY,
    ];

    const currentIndex = stageOrder.indexOf(state.currentStage);

    // Mark current stage as completed
    const currentStageState = state.stages.find(s => s.stage === state.currentStage);
    if (currentStageState) {
      currentStageState.status = "completed";
      currentStageState.completedAt = Date.now();
    }

    // Move to next stage or complete
    if (currentIndex < stageOrder.length - 1) {
      const nextStage = stageOrder[currentIndex + 1]!;
      state.currentStage = nextStage;
      const nextStageState = state.stages.find(s => s.stage === state.currentStage);
      if (nextStageState) {
        nextStageState.status = "running";
        nextStageState.startedAt = Date.now();
      }
    } else {
      // Pipeline complete
      state.status = "completed";
    }

    state.updatedAt = Date.now();
    this.save(state);
    return state;
  }

  /**
   * Approve current stage and advance.
   */
  approve(id: string, stage: PipelineStage): PipelineState | null {
    const state = this.get(id);
    if (!state) return null;

    if (state.currentStage !== stage) {
      throw new Error(`Cannot approve stage ${stage}: current stage is ${state.currentStage}`);
    }

    return this.advance(id);
  }

  /**
   * Mark pipeline as failed.
   */
  fail(id: string, reason: string): PipelineState | null {
    const state = this.get(id);
    if (!state) return null;

    state.status = "failed";
    state.updatedAt = Date.now();

    const currentStageState = state.stages.find(s => s.stage === state.currentStage);
    if (currentStageState) {
      currentStageState.status = "failed";
      currentStageState.output = reason;
    }

    this.save(state);
    return state;
  }

  /**
   * Delete pipeline.
   */
  delete(id: string): boolean {
    const filePath = this.getFilePath(id);
    if (!fs.existsSync(filePath)) return false;

    try {
      fs.unlinkSync(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // ── Private Helpers ─────────────────────────────────────────────

  private save(state: PipelineState): void {
    const filePath = this.getFilePath(state.id);
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), "utf-8");
  }

  private getFilePath(id: string): string {
    return path.join(this.pipelinesDir, `${id}.json`);
  }

  private listFiles(): string[] {
    this.ensureDir();
    const files = fs.readdirSync(this.pipelinesDir);
    return files
      .filter(f => f.endsWith(".json"))
      .map(f => f.replace(".json", ""));
  }

  private ensureDir(): void {
    if (!fs.existsSync(this.pipelinesDir)) {
      fs.mkdirSync(this.pipelinesDir, { recursive: true });
    }
  }
}
