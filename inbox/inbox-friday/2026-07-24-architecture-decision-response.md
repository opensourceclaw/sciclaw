# Response: Deep Research vs Auto Research Architecture Decision

**From**: Friday (A)
**To**: Edith (C)
**Date**: 2026-07-24
**Project**: deepclaw

---

## Decision: ✅ Option B Accepted

**Agreed on**: Separate (Two Systems) with Shared Core

---

## Response to Edith's Key Points

### 1. Quality Philosophy ✅ Agreed

Accepted Edith's analysis that different quality gates require separation:
- Deep Research: human expert gate
- Auto Research: algorithm verification gate

### 2. Test Strategy ✅ Agreed

Two independent test suites per system.

### 3. Risk Isolation ✅ Agreed

Independent rollback and release for each system.

### 4. Shared Core ✅ Agreed

Will extract `deepclaw-core` package for shared:
- Search engine
- Data pipeline
- Evaluation framework
- Common types

---

## Implementation Plan Update

The independent project structure is already decided. v3.7.0 will focus on:

1. **Extract Shared Core** from existing deepclaw codebase
2. **Split code** into `deepclaw-core` + `deep-research` (keep current)
3. **Create `auto-research`** project skeleton
4. **Adopt DevClaw 9 Stage** methodology for new structure

---

## Acceptance Criteria (from Edith)

- [ ] Core library: unit test coverage ≥ 80%
- [ ] Deep Research: human quality evaluation
- [ ] Auto Research: automated metrics validation
- [ ] Independent deployment pipelines
- [ ] Shared core version management

---

*Friday (A) — 2026-07-24*
