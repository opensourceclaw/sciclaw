# Migration Guide: v3.4.0 → v3.5.0

This guide helps you migrate from DeepClaw v3.4.0 to v3.5.0.

## Overview

v3.5.0 introduces significant new features:

- **Gate Enforcement System** — Quality checkpoints in research pipelines
- **Pipeline CLI** — Command-line control for research workflows
- **Monitoring Observer** — Metrics collection and alerting
- **Human-in-the-Loop Approval** — Approval flow for critical decisions
- **Trigger Manager** — Scheduled and event-based research triggers
- **Provider Registry Enhancement** — Capability routing and fallback chains

## Breaking Changes

### None

v3.5.0 is **backward compatible** with v3.4.0. All existing APIs continue to work without modification.

## New Features

### Gate System

Enforce quality checkpoints before pipeline progression:

```typescript
import { GateRegistry, InternalVerifyGate } from "deepclaw/gate";

const registry = new GateRegistry();
const gate = new InternalVerifyGate(registry);

// Validate submission
const result = gate.validate({
  pipelineId: "pipeline-1",
  version: "v3.5.0",
  typeCheck: { passed: true, errors: 0 },
  build: { passed: true },
  tests: { total: 100, passed: 100, failed: 0, skipped: 0 },
  regression: { passed: true, previousTotal: 95, currentTotal: 100 },
  qualityChecks: {
    hasChineseChars: false,
    hasHardcodedPaths: false,
    hasMissingApacheHeaders: false,
  },
});
```

### Pipeline CLI

Control research workflows from the command line:

```bash
# Create a new pipeline
deepclaw pipeline create "AI Safety Research"

# Check status
deepclaw pipeline status

# Approve a stage
deepclaw pipeline approve pipeline-abc123 plan

# Run verification
deepclaw pipeline verify pipeline-abc123
```

### Monitoring Observer

Track research metrics:

```typescript
import { DeepClawObserver } from "deepclaw/monitoring";

const observer = new DeepClawObserver();

// Lifecycle hooks
observer.onResearchStart("pipeline-1", "AI Safety");
observer.onPhaseEnd("Search", 15000);
observer.onAgentEnd("search", 12000, "success");
observer.onSearchResult("AI safety", 42, true);
observer.recordTokenUsage(5000);

// Get metrics
const metrics = observer.onResearchEnd("pipeline-1", true);
console.log(metrics.tokenUsage); // 5000

// Get alerts
const alerts = observer.getAlerts();
```

### Human-in-the-Loop Approval

Add approval flow for critical decisions:

```typescript
import { ApprovalFlow, ApprovalGate } from "deepclaw/approval";
import { GateRegistry } from "deepclaw/gate";

const registry = new GateRegistry();
const flow = new ApprovalFlow();
const gate = new ApprovalGate(registry, flow);

// Request approval
const result = await gate.requestApproval(
  "research_plan",
  "pipeline-1",
  "Research Plan Approval",
  "Please review the research plan",
  { estimatedTokens: 50000 }
);

// Process decision
gate.processDecision(result.requestId, "approve", "reviewer@example.com");
```

### Trigger Manager

Schedule automated research runs:

```typescript
import { TriggerManager } from "deepclaw/trigger";

const manager = new TriggerManager();

// Schedule daily research
manager.register("daily-ai-news", "schedule", {
  cron: "0 9 * * *", // 9 AM daily
  topic: "Latest AI developments",
  sources: ["duckduckgo", "arxiv"],
});

// Manual trigger
manager.register("on-demand", "manual", {
  topic: "Custom research topic",
});

// Execute
await manager.executeByName("on-demand");
```

### Provider Registry Enhancement

Route requests to LLM providers with fallback:

```typescript
import { LLMProviderRegistry } from "deepclaw/llm";

// Register with metadata
LLMProviderRegistry.register("deepseek", DeepSeekProvider, {
  capabilities: ["chat", "streaming", "embeddings"],
  defaultModel: "deepseek-chat",
  maxTokens: 32000,
});

// Execute with fallback
const result = await LLMProviderRegistry.executeWithFallback(request, {
  enabled: true,
  maxRetries: 3,
  retryDelay: 1000,
  providers: ["deepseek", "qwen", "kimi"],
});
```

## Configuration Changes

### New Directories

v3.5.0 creates new directories for persistence:

| Directory | Purpose |
|-----------|---------|
| `~/.deepclaw/gates/` | Gate state persistence |
| `~/.deepclaw/pipelines/` | Pipeline state |
| `~/.deepclaw/metrics/` | Metrics history |
| `~/.deepclaw/approval/` | Approval requests |
| `~/.deepclaw/triggers/` | Trigger definitions |

### No Config Changes Required

Existing configuration files (`src/config.ts`) work without modification.

## Migration Steps

1. **Update package**:
   ```bash
   npm install deepclaw@3.5.0
   ```

2. **No code changes required** — all existing APIs work unchanged

3. **New features are opt-in** — enable as needed

4. **Run tests**:
   ```bash
   npm test
   ```

## Deprecated APIs

### None

No APIs were deprecated in v3.5.0.

## Questions?

If you encounter issues during migration, please open an issue at:
https://github.com/peterchengorg/deepclaw/issues

---

*DeepClaw v3.5.0 — Migration Guide*
