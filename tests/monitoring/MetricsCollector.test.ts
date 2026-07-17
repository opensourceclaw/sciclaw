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
// DeepClaw v3.5.0 - MetricsCollector Tests

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { MetricsCollector } from "../../src/monitoring/MetricsCollector.js";

describe("MetricsCollector", () => {
  let tmpDir: string;
  let collector: MetricsCollector;

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), `deepclaw-metrics-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    collector = new MetricsCollector(tmpDir, 100);
  });

  afterEach(() => {
    try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
  });

  it("startSession() initializes metrics", () => {
    collector.startSession("pipeline-1");
    const metrics = collector.getMetrics();

    expect(metrics.researchDurationMs).toBe(0);
    expect(metrics.tokenUsage).toBe(0);
    expect(metrics.sourceCount).toBe(0);
  });

  it("recordPhaseDuration() tracks phase durations", () => {
    collector.startSession("pipeline-1");
    collector.recordPhaseDuration("Plan", 5000);
    collector.recordPhaseDuration("Search", 10000);

    const metrics = collector.getMetrics();
    expect(metrics.phaseDurationMs["Plan"]).toBe(5000);
    expect(metrics.phaseDurationMs["Search"]).toBe(10000);
  });

  it("updateCacheHitRate() calculates rate correctly", () => {
    collector.startSession("pipeline-1");
    collector.updateCacheHitRate(8, 10);
    collector.updateCacheHitRate(2, 10);

    const metrics = collector.getMetrics();
    expect(metrics.cacheHitRate).toBe(0.5); // 10/20
  });

  it("persist() writes snapshot to disk", () => {
    collector.startSession("pipeline-1");
    collector.addTokenUsage(1000);
    collector.setResearchDuration(5000);

    const snapshot = collector.createSnapshot("pipeline-1");
    collector.persist(snapshot);

    const filePath = path.join(tmpDir, "pipeline-pipeline-1.json");
    expect(fs.existsSync(filePath)).toBe(true);

    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    expect(data.pipelineId).toBe("pipeline-1");
    expect(data.metrics.tokenUsage).toBe(1000);
  });

  it("loadHistory() loads persisted history", () => {
    collector.startSession("pipeline-1");
    collector.setResearchDuration(5000);
    const snapshot1 = collector.createSnapshot("pipeline-1");
    collector.persist(snapshot1);

    collector.startSession("pipeline-2");
    collector.setResearchDuration(3000);
    const snapshot2 = collector.createSnapshot("pipeline-2");
    collector.persist(snapshot2);

    const history = collector.loadHistory();
    expect(history.length).toBe(2);
  });
});
