# Task: DeepClaw v3.5.0 Phase 3 — Detailed Design

**From**: Friday (A)
**To**: Jarvis (B)
**Date**: 2026-07-17
**Stage**: DESIGN — Detailed Design
**Priority**: Medium
**PipelineId**: deepclaw-v3.5.0-phase3
**Project**: deepclaw
**Version**: v3.5.0

---

## Background

Phase 3 summary design approved by Peter. Reference: `docs/design/v3.5.0-phase3-summary.md`

Two areas:
1. DevClaw Pattern Integration (TriggerManager + ProviderRegistry)
2. Documentation Enhancement (CONTRIBUTING, Migration, Diagrams, README)

---

## Detailed Design Scope

### 1. Trigger Manager

**New files**:
```
src/trigger/
├── types.ts              # TriggerType, TriggerConfig, TriggerEvent
├── TriggerManager.ts     # Trigger registration + execution
└── index.ts
```

**Trigger Types**:
- `schedule`: Cron-based triggers (e.g., daily deep research)
- `event`: Event-based triggers (e.g., on research failure)
- `manual`: CLI-triggered (e.g., `deepclaw trigger run <name>`)

**Key Design Decisions to Document**:
- Why file-based (no external scheduler dependency)
- Why lightweight (DeepClaw is interactive, not automated)
- How triggers integrate with existing PipelineCoordinator

### 2. Provider Registry

**Update**: `src/llm/` — add ProviderRegistry

**Key Design**:
- Unified interface wrapping 5 existing providers (DeepSeek, Qwen, Kimi, GLM, MiniMax)
- Dynamic routing: select provider by name or capability
- Fallback: auto-fallback on provider failure
- Registry pattern: register → lookup → invoke

**Design Decisions to Document**:
- Why registry pattern (not factory)
- How fallback works (failover chain)
- How existing providers are wrapped (no breaking changes)

### 3. Documentation

**Required documents**:
- `CONTRIBUTING.md` — dev setup, PR process, code style
- `docs/MIGRATION.md` — migration from v3.4.0
- `docs/architecture/diagrams.md` — Mermaid diagrams for pipeline flow
- `README.md` — update with v3.5.0 features

---

## Deliverable

Write detailed design document to `docs/design/v3.5.0-phase3-detailed.md`

Include:
1. File-by-file class/interface definitions
2. Method signatures
3. Error handling strategy
4. Alternative approaches
5. Test case outline
6. Documentation outline for each new doc

---

## Important

- **DO NOT implement** — design only
- TriggerManager should be lightweight (~150 lines)
- ProviderRegistry should wrap existing providers, not rewrite them
- Documentation scope: CONTRIBUTING + Migration + Diagrams + README update

---

## Project Location

`/Users/liantian/workspace/osprojects/deepclaw`