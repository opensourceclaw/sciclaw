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
// SciClaw v3.5.0 - Monitoring Observer Tests

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { SciClawObserver } from "../../src/monitoring/Observer.js";
import type { MetricsSnapshot, Alert } from "../../src/monitoring/types.js";

describe("SciClawObserver", () => {
  let tmpDir: string;
  let observer: SciClawObserver;

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), `deepclaw-observer-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    observer = new SciClawObserver({ metricsDir: tmpDir });
  });

  afterEach(() => {
    try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
  });

  describe("lifecycle", () => {
    it("onResearchStart() initializes metrics", () => {
      observer.onResearchStart("pipeline-1", "Test topic");
      const metrics = observer.getMetrics();
      expect(metrics.researchDurationMs).toBe(0);
      expect(metrics.tokenUsage).toBe(0);
    });

    it("onResearchEnd() persists snapshot", () => {
      observer.onResearchStart("pipeline-1", "Test topic");
      observer.recordTokenUsage(1000);
      const metrics = observer.onResearchEnd("pipeline-1", true);

      expect(metrics.tokenUsage).toBe(1000);
      expect(metrics.researchDurationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe("phase hooks", () => {
    it("onPhaseEnd() records phase duration", () => {
      observer.onResearchStart("pipeline-1", "Test");
      observer.onPhaseEnd("Plan", 5000);
      observer.onPhaseEnd("Search", 10000);

      const metrics = observer.getMetrics();
      expect(metrics.phaseDurationMs["Plan"]).toBe(5000);
      expect(metrics.phaseDurationMs["Search"]).toBe(10000);
    });
  });

  describe("agent hooks", () => {
    it("onAgentEnd() records agent response time", () => {
      observer.onResearchStart("pipeline-1", "Test");
      observer.onAgentEnd("planning", 2000, "success");
      observer.onAgentEnd("search", 5000, "success");

      const metrics = observer.getMetrics();
      expect(metrics.agentResponseTimeMs["planning"]).toBe(2000);
      expect(metrics.agentResponseTimeMs["search"]).toBe(5000);
    });

    it("onAgentEnd() updates error rate on failure", () => {
      observer.onResearchStart("pipeline-1", "Test");
      observer.onAgentEnd("planning", 2000, "failed");

      const metrics = observer.getMetrics();
      expect(metrics.errorRate).toBe(1);
    });
  });

  describe("search hooks", () => {
    it("onSearchResult() updates cache hit rate", () => {
      observer.onResearchStart("pipeline-1", "Test");
      observer.onSearchResult("query 1", 10, true);
      observer.onSearchResult("query 2", 5, false);

      const metrics = observer.getMetrics();
      expect(metrics.cacheHitRate).toBe(0.5);
    });

    it("onSearchResult() updates source count", () => {
      observer.onResearchStart("pipeline-1", "Test");
      observer.onSearchResult("query 1", 10, true);
      observer.onSearchResult("query 2", 5, false);

      const metrics = observer.getMetrics();
      expect(metrics.sourceCount).toBe(5); // Last result count
    });
  });

  describe("token tracking", () => {
    it("recordTokenUsage() accumulates tokens", () => {
      observer.onResearchStart("pipeline-1", "Test");
      observer.recordTokenUsage(1000);
      observer.recordTokenUsage(500);

      const metrics = observer.getMetrics();
      expect(metrics.tokenUsage).toBe(1500);
    });
  });

  describe("alerts", () => {
    it("fires alert on high error rate", () => {
      observer.onResearchStart("pipeline-1", "Test");
      // Trigger high error rate (5 failures out of 10 = 0.5 > 0.3)
      for (let i = 0; i < 5; i++) {
        observer.onAgentEnd(`agent-${i}`, 100, "failed");
      }
      for (let i = 5; i < 10; i++) {
        observer.onAgentEnd(`agent-${i}`, 100, "success");
      }

      observer.onResearchEnd("pipeline-1", false);
      const alerts = observer.getAlerts();
      expect(alerts.some(a => a.name === "high_error_rate")).toBe(true);
    });

    it("fires alert on zero sources", () => {
      observer.onResearchStart("pipeline-1", "Test");
      observer.onSearchResult("query", 0, false);

      observer.onResearchEnd("pipeline-1", false);
      const alerts = observer.getAlerts();
      expect(alerts.some(a => a.name === "zero_sources")).toBe(true);
    });
  });

  describe("status", () => {
    it("getStatus() returns monitoring status", () => {
      const status = observer.getStatus();
      expect(status.enabled).toBe(true);
      expect(status.uptime).toBeGreaterThanOrEqual(0);
      expect(status.metricsCollected).toBe(0);
    });

    it("reset() clears all state", () => {
      observer.onResearchStart("pipeline-1", "Test");
      observer.recordTokenUsage(1000);
      observer.reset();

      const metrics = observer.getMetrics();
      expect(metrics.tokenUsage).toBe(0);
    });
  });

  describe("error handling", () => {
    it("hooks don't throw on errors", () => {
      // All hooks should be safe
      expect(() => observer.onResearchStart("test", "topic")).not.toThrow();
      expect(() => observer.onAgentEnd("test", 100, "success")).not.toThrow();
      expect(() => observer.onSearchResult("test", 10, true)).not.toThrow();
    });
  });

  describe("subscriptions", () => {
    it("onMetrics() subscribes to metrics updates", () => {
      let received: MetricsSnapshot | null = null;
      observer.onMetrics((snapshot) => { received = snapshot; });

      observer.onResearchStart("pipeline-1", "Test");
      observer.onResearchEnd("pipeline-1", true);

      expect(received).not.toBeNull();
      expect(received?.pipelineId).toBe("pipeline-1");
    });

    it("onAlert() subscribes to alerts", () => {
      let received: Alert | null = null;
      observer.onAlert((alert) => { received = alert; });

      observer.onResearchStart("pipeline-1", "Test");
      // Trigger zero sources alert
      observer.onSearchResult("query", 0, false);
      observer.onResearchEnd("pipeline-1", false);

      expect(received).not.toBeNull();
    });
  });
});
