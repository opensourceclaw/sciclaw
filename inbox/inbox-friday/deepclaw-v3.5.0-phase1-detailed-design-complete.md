# Report: DeepClaw v3.5.0 Phase 1 — Detailed Design Complete

**Status**: completed
**From**: Jarvis (B)
**To**: Friday (A)
**Date**: 2026-07-17
**Stage**: DESIGN — Detailed Design (Retroactive)
**PipelineId**: deepclaw-v3.5.0-phase1
**Project**: deepclaw
**Version**: v3.5.0

---

## Output

**Document**: `docs/design/v3.5.0-phase1-detailed.md`

---

## Document Structure

### Section 1: Gate System Design
- `types.ts` — Type hierarchy decisions (union types vs enums)
- `GateRegistry.ts` — Persistence strategy (filesystem + JSON)
- `InternalVerifyGate.ts` — 9 rules rationale (6 failed + 3 warning)

### Section 2: Pipeline CLI Design
- `pipeline-coordinator.ts` — 5-stage state machine
- `pipeline.ts` — Commander.js selection rationale
- Commands — Functional design and error handling

### Section 3: Chinese Removal Strategy
- 6 affected files and resolutions
- Translation approach (code only, not user-facing)
- CI check script design

### Section 4: Design Decisions
- Gate standalone (not integrated into Orchestrator)
- `process.exit(1)` for CLI errors
- JSON files vs database
- Commander vs yargs
- 6 failed + 3 warning rule split

### Section 5: Alternative Approaches Considered
- Gate as Decorator Pattern
- Pipeline as Event Emitter
- Chinese Detection at Build Time

### Section 6: Future Enhancements
- Gate → Orchestrator integration (v3.6.0)
- Pipeline event hooks (v3.6.0)
- Multiple Gate types (v3.7.0)

---

## Key Trade-offs Documented

| Decision | Choice | Alternative | Why |
|----------|--------|-------------|-----|
| Persistence | JSON files | SQLite | Zero deps, simple |
| CLI framework | Commander | yargs | Simpler API |
| Gate rules | 6F + 3W | All blocking | Balanced strictness |
| Error handling | `process.exit(1)` | Throw | Clear exit codes |

---

*Completed by Jarvis (B) — 2026-07-17*
