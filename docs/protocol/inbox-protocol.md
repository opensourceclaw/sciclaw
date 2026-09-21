> **Synced from the agent family methodology** (originated in DevClaw) on 2026-07-24 · This project: sciclaw

# Inbox Communication Protocol

**Version**: 3.3
**Date**: 2026-07-21
**Status**: Active

---

## v3.3 Changelog (2026-07-21)

- **Added**: `CompletePipelineGate` (`src/gate/gates/CompletePipelineGate.ts`) - Enforces full pipeline execution before RELEASE
- **Added**: `GateInitializer.registerCompletePipelineGate()` - Register and obtain the gate instance
- **Changed**: `ProcessOrchestrator` now accepts `completePipelineGate` option; calls `markStageCompleted` after each successful transition and `requireComplete` before entering RELEASE (non-forced)
- **Context**: v7.0.0-rc.17 closes the loophole where Friday could skip BUILD/TEST/RELEASE after DESIGN

## v3.2 Changelog (2026-07-21)

- **Added**: `inbox-supervisor/` directory — Edith Process Supervisor reports → Peter
- **Added**: `inbox-governance/stage-events/` directory — StageTransitionEvent files emitted by ProcessOrchestrator
- **Added**: `StageTransitionEvent` file format
- **Added**: `SupervisorReport` file format
- **Added**: Governance gates (`version-budget-gate`, `scope-boundary-gate`) registered in GateRegistry
- **Context**: v7.0.0-rc.16 Separation of Powers — judicial authority transferred from Friday to Edith

---

## Overview

This document defines the communication protocol for the agent family's AI-native multi-agent system. All agents communicate through the inbox file system, enabling persistent sessions and high cache hit rates.

Version 2.7 introduces **project-level inbox isolation** - each project has its own inbox directory.

---

## Agent Role Names (v3.1)

### Platform-Default Names

Agent role names are configurable. Platform-standard defaults (column named by origin, DevClaw):

| Origin Role | Platform Default | Environment Variable |
|-------------|------------------|---------------------|
| **PlanAgent** | `Planner` | `AGENT_PLANNER_NAME` |
| **CodeAgent** | `Builder` | `AGENT_BUILDER_NAME` |
| **TestAgent** | `Tester` | `AGENT_TESTER_NAME` |
| **DeployAgent** | `Builder` | `AGENT_BUILDER_NAME` |
| **OpsAgent** | `Builder` | `AGENT_BUILDER_NAME` |
| **GovernanceAgent** | `Planner` | `AGENT_PLANNER_NAME` |

### Configuration Interface

```typescript
interface AgentConfig {
  /** Name for PlanAgent (default: "Planner") */
  planAgentName?: string;

  /** Name for CodeAgent (default: "Builder") */
  codeAgentName?: string;

  /** Name for TestAgent (default: "Tester") */
  testAgentName?: string;
}
```

### Configuration Sources (Priority Order)

1. **Environment Variables**: `AGENT_PLANNER_NAME`, `AGENT_BUILDER_NAME`, `AGENT_TESTER_NAME`
2. **Config File**: `devclaw.config.json` → `agentNames`
3. **Default Values**: `Planner`, `Builder`, `Tester`

### Example: Private Persona Override

```bash
# .env
AGENT_PLANNER_NAME=Friday
AGENT_BUILDER_NAME=Jarvis
AGENT_TESTER_NAME=Edith
```

Or in `devclaw.config.json`:

```json
{
  "agentNames": {
    "planAgentName": "Friday",
    "codeAgentName": "Jarvis",
    "testAgentName": "Edith"
  }
}
```

### Backward Compatibility

- Inbox files using old names (`Friday`, `Jarvis`, `Edith`) are still valid
- The platform resolves agent names from `From`/`To` fields using the configured mapping
- No breaking changes to existing workflows

---

## Process Supervision Flow (v3.2, Separation of Powers)

### Overview

With v7.0.0-rc.16, the family methodology introduces **Separation of Powers** governance:
- **Legislative** (Friday): Defines process, rules, architecture
- **Executive** (Jarvis): Executes development, implements code
- **Judicial** (Edith): Independent oversight, supervises stage transitions

The judicial oversight is achieved through a **protocol固化** (hardcoded) flow, not manual coordination.

### Supervision Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                Stage Transition Supervision Flow                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Friday (Legislative)                                              │
│       │                                                              │
│       ├── 1. Complete current Stage (SubStages + Gates)            │
│       │                                                              │
│       ├── 2. Write StageTransitionEvent                            │
│       │     → inbox/inbox-governance/stage-events/{uuid}.md        │
│       │                                                              │
│       ├── 3. Write Supervisor Request to inbox-test/                │
│       │     → inbox-test/supervisor-request-{uuid}.md              │
│       │     (Format: EventRef, StageTransition, Version)           │
│       │                                                              │
│       ├── 4. Wait for Supervisor Report                            │
│       │                                                              │
│       ▼                                                              │
┌─────────────────────────────────────────────────────────────────────┐
│                     Peter (Coordinator)                              │
│       │                                                              │
│       ├── Notify Edith to scan inbox-test/                         │
│       │     (Standard coordination, same as test tasks)            │
│       │                                                              │
│       ▼                                                              │
┌─────────────────────────────────────────────────────────────────────┐
│  Edith (Judicial)                                                  │
│       │                                                              │
│       ├── 5. Scan inbox-test/ → Find Supervisor Request             │
│       │                                                              │
│       ├── 6. Read StageTransitionEvent from stage-events/           │
│       │                                                              │
│       ├── 7. Execute 7-item checklist:                            │
│       │     □ SubStages complete                                   │
│       │     □ Gates passed                                         │
│       │     □ Required outputs present                              │
│       │     □ Peter approvals confirmed                             │
│       │     □ No skipped mandatory stages                           │
│       │     □ Version budget within limit                          │
│       │     □ Scope matches version theme                          │
│       │                                                              │
│       ├── 8. Write Supervisor Report                               │
│       │     → inbox/inbox-supervisor/report-{uuid}.md              │
│       │     → inbox/inbox-friday/ (notify Friday)                 │
│       │                                                              │
│       ▼                                                              │
┌─────────────────────────────────────────────────────────────────────┐
│  Friday (Legislative)                                              │
│       │                                                              │
│       ├── 9. Read Supervisor Report                                │
│       │                                                              │
│       └── APPROVED → Continue to next Stage                        │
│           VETOED → Stop, fix issues or wait for Peter Override    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Supervisor Request in inbox-test/** | Edith already scans inbox-test/, no new directory needed |
| **Event-driven > Polling** | Friday triggers supervision immediately after writing event |
| **Report in inbox-supervisor/** | Separates test results from governance reports |
| **Friday waits for report** | Protocol固化: Friday CANNOT proceed without Supervisor Report |
| **Peter Override via inbox-governance/overrides/** | Standard inbox pattern, auditable |

### Protocol Constraints

**Friday MUST**:
- Write StageTransitionEvent BEFORE writing Supervisor Request
- Write Supervisor Request to inbox-test/ (not inbox-code/ or elsewhere)
- Wait for Supervisor Report BEFORE proceeding to next Stage
- Check inbox-supervisor/ for report (not rely on Peter notification)
- Stop on VETOED unless Peter Override exists

**Edith MUST**:
- Read Supervisor Request from inbox-test/
- Read corresponding StageTransitionEvent from stage-events/
- Execute all 7 checks
- Write report to inbox-supervisor/ AND inbox-friday/

**Peter CAN**:
- Override veto by writing to inbox-governance/overrides/{eventId}.md
- Audit all Supervisor Reports via inbox-supervisor/

---

## Architecture

### Agent Mapping (Default Names)

| Origin Role | Platform Default | Inbox Directory | Description |
| --------------- | ------ | --------------- | ---------------------- |
| **PlanAgent** | Planner | `inbox-plan/` | Planning, architecture |
| **CodeAgent** | Builder | `inbox-code/` | Code generation |
| **TestAgent** | Tester | `inbox-test/` | Independent testing |
| **DeployAgent** | Builder | `inbox-deploy/` | Deployment |
| **OpsAgent** | Builder | `inbox-ops/` | Operations |
| **GovernanceAgent** | Planner | `inbox-gov/` | Governance |
| **ResultCollector** | Planner | `inbox-friday/` | Collect results |

---

## Directory Structure

### Project-Level Inbox (Version 2.7+)

Each project has its own inbox directory at the project root:

```
{project}/
└── inbox/
    ├── inbox-code/         # Friday → Jarvis: Development tasks
    │   ├── *.md          # Task files
    │   ├── ack/          # Acknowledgments
    │   └── processed/    # Completed tasks
    ├── inbox-test/       # Friday → Edith: Test tasks
    │   ├── *.md          # Task files
    │   └── processed/    # Completed tasks
    ├── inbox-deploy/     # Friday → Jarvis: Deploy tasks
    │   ├── *.md          # Task files
    │   └── processed/    # Completed tasks
    ├── inbox-ops/        # Friday → Jarvis: Ops tasks
    │   ├── *.md          # Task files
    │   └── processed/    # Completed tasks
    ├── inbox-governance/ # Friday → Governance tasks
    │   ├── *.md          # Task files
    │   └── processed/    # Completed tasks
    └── inbox-friday/     # Jarvis/Edith → Friday: Results
        ├── *.md          # Result files
        └── processed/    # Archived results
```

### Legacy Structure (Deprecated)

```
comm/
├── inbox-jarvis/          # Legacy (deprecated)
├── inbox-edith/           # Legacy (deprecated)
└── inbox-friday/          # Global results (deprecated)
```

---

## Agent Task Discovery

### Jarvis (Code Agent)

1. Scan `{project}/inbox/inbox-code/` for new tasks
2. Filter by `To: Jarvis` or `To: Code Agent` in task header
3. Process task and write results to `{project}/inbox/inbox-friday/`

### Edith (Test Agent)

1. Scan `{project}/inbox/inbox-test/` for new tasks
2. Filter by `To: Edith` or `To: Test Agent` in task header
3. Process task and write results to `{project}/inbox/inbox-friday/`

### Key Discovery Rules

| Rule                | Description                                                                |
| ------------------- | -------------------------------------------------------------------------- |
| **Project context** | Agent must know which project to work on (from task or context)            |
| **Path resolution** | Use `Project Location` field in task to resolve absolute path              |
| **Scan pattern**    | `inbox/inbox-{stage}/` where stage ∈ {code, test, deploy, ops, governance} |

---

## Communication Flow

```
Friday (PlanAgent)
    │
    ├─→ inbox/ inbox-code/      (→ Jarvis: Development)
    ├─→ inbox/ inbox-test/      (→ Edith: Testing)
    ├─→ inbox/ inbox-deploy/    (→ Jarvis: Deployment)
    ├─→ inbox/ inbox-ops/       (→ Jarvis: Operations)
    └─→ inbox/ inbox-gov/       (→ Governance: Governance)
         │
         ↓
    Jarvis/Edith processes task
         │
         ↓
    Writes result to {project}/inbox/inbox-friday/
         │
         ↓
    Friday reads result and continues pipeline
```

## SubStage & Gate Enforcement (v3.0, 2026-07-16)

### Mandatory SubStages

Each Stage has mandatory SubStages that **MUST NOT be skipped**. Friday is responsible for enforcing these before proceeding to the next Stage.

| Stage | SubStage | Owner | Gate | Skip Allowed? |
|-------|----------|:-----:|------|:------------:|
| **PLAN** | plan-draft | Friday | Plan Approval Gate | ❌ |
| **DESIGN** | detailed-design | Jarvis | — | ❌ |
| | design-review | Friday | Design Review Gate | ❌ |
| **BUILD** | implementation | Jarvis | — | ❌ |
| | **code-review** | **Friday** | **Code Review Gate** | **❌** |
| | internal-verify | Friday | — | ❌ |
| **TEST** | test-acceptance | TestAgent | Test Acceptance Gate | ❌ |
| **RELEASE** | release-approval | Peter | Release Approval Gate | ❌ |

### Code Review SubStage (CRITICAL)

After Jarvis completes BUILD implementation, Friday **MUST** perform a Code Review before:
- Sending the Edith acceptance task
- Proceeding to TEST Stage

**Code Review Checklist**:
1. Read all new/modified source files
2. Check for: type safety, error handling, edge cases, code style
3. Check for: hardcoded paths, Chinese characters, missing Apache headers
4. Document findings with severity (blocking / non-blocking)
5. Output explicit APPROVED or CHANGES_REQUESTED verdict

**Enforcement**:
- Friday **MUST NOT** write to `inbox/inbox-test/` until Code Review is APPROVED
- Friday **MUST** log the Code Review result in `inbox/inbox-friday/` before proceeding
- If Code Review finds blocking issues, Friday **MUST** send a fix task to Jarvis before continuing

### Friday Self-Audit

Before any Stage transition, Friday **MUST** self-audit against this checklist:

```
□ Is the current SubStage complete?
□ Is the Gate for this SubStage passed?
□ Have I written the result to inbox-friday?
□ Am I about to skip any mandatory SubStage?
```

If any check fails, STOP and complete the missing SubStage first.

---

## Task File Format

### Required Fields

| Field        | Description         | Example                  |
| ------------ | ------------------- | ------------------------ |
| `From`       | Sender agent name   | Friday (A)               |
| `To`         | Receiver agent name | Jarvis (B) / Edith (C)   |
| `Date`       | ISO 8601 date       | 2026-07-06               |
| `Stage`      | SDLC stage          | code / test / deploy     |
| `Priority`   | Priority level      | High                     |
| `PipelineId` | Pipeline identifier | pipeline-20260706-cog540 |
| `Project`    | Project name        | claw-cog                 |
| `Version`    | Target version      | v5.4.0                   |

### Optional Fields

| Field              | Description                        |
| ------------------ | ---------------------------------- |
| `Project Location` | Absolute path to project directory |

### Example

```markdown
# Task: claw-cog v5.4.0 Development

**From**: Friday (A)
**To**: Jarvis (B)
**Date**: 2026-07-06
**Stage**: code
**Priority**: High
**PipelineId**: pipeline-20260706-cog540
**Project**: claw-cog
**Version**: v5.4.0

---

## Background

**Project**: claw-cog (AI Consciousness Component)
**Project Location**: `/Users/liantian/workspace/osprojects/claw-cog/`

## Task

1. Implement TaskTypeDetector module
2. Implement TaskContextAdapter module

## Acceptance Criteria

- [ ] npm run build passes
- [ ] npm test passes

---

## Project Location

`/Users/liantian/workspace/osprojects/claw-cog/`
```

---

## Reply File Format

### Required Fields

| Field        | Description         | Example                  |
| ------------ | ------------------- | ------------------------ |
| `Status`     | completion status   | completed / failed       |
| `From`       | Sender agent name   | Jarvis (B) / Edith (C)   |
| `Date`       | ISO 8601 date       | 2026-07-06               |
| `PipelineId` | Pipeline identifier | pipeline-20260706-cog540 |

### Example

```markdown
# Report: claw-cog v5.4.0 Test

**Status**: completed
**From**: Edith (C)
**Date**: 2026-07-06
**PipelineId**: pipeline-20260706-cog540

---

## Test Results

| Test | Status |
|------|--------|
| TaskTypeDetector.detect | ✅ Pass |
| TaskTypeDetector.detectWithConfidence | ✅ Pass |
| TaskContextAdapter.adapt | ✅ Pass |

## Coverage

- Total: 177 tests passed
- Coverage: 85%

## Issues

None.
```

---

## File Naming Convention

### Task Files

```
pipeline-{date}-{project}-{stage}.md
```

Examples:

- `pipeline-20260706-cog540-code.md`
- `pipeline-20260706-cog540-test.md`
- `pipeline-20260706-cog540-deploy.md`

### Reply Files

```
pipeline-{date}-{project}-{stage}-complete.md
```

Examples:

- `pipeline-20260706-cog540-code-complete.md`
- `pipeline-20260706-cog540-test-complete.md`

---

## Error Handling

### Retry Policy

- Max retries: 3
- Backoff: exponential (5s, 10s, 30s)

### Timeout

- Default timeout: 300 seconds (5 minutes)
- Configurable per task

### Missing Project Location

If `Project Location` is missing:

1. Agent should ask Friday for clarification
2. Or use default workspace path

---

## Version History

| Version | Date       | Changes                             |
| ------- | ---------- | ----------------------------------- |
| 3.2     | 2026-07-21 | Added inbox-supervisor/, stage-events/, StageTransitionEvent, SupervisorReport (rc.16 Separation of Powers) |
| 3.1     | 2026-07-16 | Added configurable agent role names, platform defaults |
| 3.0     | 2026-07-16 | Added SubStage & Gate Enforcement, mandatory Code Review |
| 2.7     | 2026-07-06 | Added project-level inbox isolation |
| 2.6     | 2026-07-05 | Updated agent mapping               |
| 2.0     | 2026-07-04 | Major protocol restructure          |
| 1.0     | 2026-07-04 | Initial version                     |

---

## Governance Directories (v3.2)

### Directory Layout

```
{project}/inbox/
├── inbox-governance/
│   ├── stage-events/           # StageTransitionEvent files (Friday emits, Edith polls)
│   │   └── *.md
│   ├── overrides/              # Peter override files (named {eventId}.md)
│   │   └── *.md
│   └── processed/
└── inbox-supervisor/           # Edith SupervisorReport files → Peter
    ├── *.md
    └── processed/
```

### StageTransitionEvent Format

Emitted by `ProcessOrchestrator.transitionTo()` after each successful stage transition. Written atomically (tmp + rename) to `inbox-governance/stage-events/`.

```markdown
# Stage Transition Event

**EventId**: {uuid}
**Date**: {ISO 8601}
**EventType**: STAGE_TRANSITION
**FromStage**: PLAN
**ToStage**: DESIGN
**Version**: 7.0.0-rc.16
**PipelineId**: {pipelineId}
**Forced**: false

---

## Gate Results

| Gate | Status |
|------|--------|
| plan-approval-gate | passed |

## Checklist

- [x] Plan approved — Peter confirmed (PASS)

## Outputs

- docs/roadmaps/v7-plan/v7.0.0-rc.16-plan.md

---

*Generated by the family ProcessOrchestrator (v7.0.0-rc.16)*
```

### SupervisorReport Format

Written by Edith (Process Supervisor) to `inbox-supervisor/` after reviewing a `StageTransitionEvent`.

```markdown
# Supervisor Report

**From**: Edith (C) — Process Supervisor
**To**: Peter
**Date**: {ISO 8601}
**EventRef**: {eventId of StageTransitionEvent}
**Verdict**: APPROVED | VETOED
**Severity**: CRITICAL | HIGH | MEDIUM | LOW

---

## Checks

| # | Check | Result | Detail |
|:-:|-------|:------:|--------|
| 1 | SubStages complete | ✅ | … |
| 2 | Gates passed | ✅ | … |
| 3 | Required outputs | ✅ | … |
| 4 | Peter approvals | ✅ | … |
| 5 | Skipped stages | ✅ | … |
| 6 | Version budget | ✅ | … |
| 7 | Scope boundary | ✅ | … |

## Verdict

**APPROVED** — All checks passed.

---

*Edith — Independent Process Supervisor*
```

### Peter Override Format

Written by Peter to `inbox-governance/overrides/{eventId}.md` to bypass a vetoed transition.

```markdown
# Peter Override

**EventId**: {eventId being overridden}
**Date**: {ISO 8601}
**ApprovedBy**: Peter
**Reason**: {why the veto is overridden}

---

Override recorded. Friday may proceed.
```
