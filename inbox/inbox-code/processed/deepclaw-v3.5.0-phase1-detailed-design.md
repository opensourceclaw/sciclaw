# Task: DeepClaw v3.5.0 Phase 1 — Detailed Design

**From**: Friday (A)
**To**: Jarvis (B)
**Date**: 2026-07-17
**Priority**: High
**Version**: v3.5.0
**Stage**: DESIGN — Detailed Design

---

## Background

Phase 1 summary design approved by Peter. Reference: `docs/design/v3.5.0-phase1-summary.md`

Three modules to design in detail:
1. Gate Enforcement System (integrate into Orchestrator)
2. Pipeline CLI (commands on top of existing PipelineCoordinator)
3. Chinese Character Removal (code cleanup)

---

## Key Context — Existing Code

### Already implemented (DO NOT redesign):

**`src/gate/`** (5 files, complete):
- `GateRegistry.ts` — registry with persistence to `~/.deepclaw/gates/gates.json`
- `gates/InternalVerifyGate.ts` — 9 validation rules (6 failed + 3 warning)
- `types.ts` — all type definitions
- `index.ts` — exports

**`src/cli/pipeline-coordinator.ts`** (complete):
- `PipelineCoordinator` class with: create, get, start, advance, approve, fail, delete
- Pipeline stages: PLAN → SEARCH → SYNTHESIZE → WRITE → VERIFY
- State persistence to `~/.deepclaw/pipelines/{id}.json`

**`src/agents/orchestrator.ts`**:
- `Orchestrator` class with `executePlan()` phase-based execution
- 4 phases: Plan → Search → Synthesize → Write
- Currently no Gate integration

---

## Detailed Design Scope

### 1. Gate → Orchestrator Integration

**File**: `src/agents/orchestrator.ts`

**Design**:
- Add optional `gateRegistry` and `internalVerifyGate` to Orchestrator constructor options
- Inject Gate check before each phase transition in `executePlan()`
- Gate check is optional — if no Gate injected, skip check (backward compatible)
- On Gate failure, skip phase and mark as "blocked"

**Pseudocode**:
```typescript
// executePlan() — inside the phase loop:
if (this.internalVerifyGate) {
  const status = this.internalVerifyGate.getStatus();
  if (status === "failed" || status === "blocked") {
    // Skip phase, record blocked result
    phaseResults.push({ order: phase.order, name: phase.name, status: "blocked", ... });
    continue;
  }
}
// ... existing dispatch logic
```

### 2. Pipeline CLI Commands

**New files**:
- `src/cli/pipeline.ts` — CLI entry, parses argv, dispatches to commands
- `src/cli/commands/start.ts` — `deepclaw pipeline start <topic>`
- `src/cli/commands/status.ts` — `deepclaw pipeline status [id]`
- `src/cli/commands/approve.ts` — `deepclaw pipeline approve <stage>`
- `src/cli/commands/verify.ts` — `deepclaw pipeline verify`

**Update files**:
- `src/cli/index.ts` — add pipeline exports

**CLI Design** (minimal, no heavy framework):
```typescript
// pipeline.ts
const args = process.argv.slice(3); // After "deepclaw pipeline"
const command = args[0];
switch (command) {
  case "start": return startCommand(args.slice(1));
  case "status": return statusCommand(args.slice(1));
  case "approve": return approveCommand(args.slice(1));
  case "verify": return verifyCommand(args.slice(1));
  default: return showHelp();
}
```

**`verify` command** — integrates with Gate:
```typescript
async function verifyCommand(pipelineId?: string) {
  const coordinator = new PipelineCoordinator();
  const registry = new GateRegistry();
  const gate = new InternalVerifyGate(registry);
  
  // Run type check
  const typeCheck = await runTypeCheck();
  // Run build
  const build = await runBuild();
  // Run tests
  const tests = await runTests();
  // Check regression
  const regression = checkRegression(tests);
  // Quality checks
  const quality = runQualityChecks();
  
  const result = gate.validate({ typeCheck, build, tests, regression, qualityChecks: quality });
  // Output result
}
```

### 3. Chinese Character Removal

**Task**: Translate Chinese comments in 31 source files to English.

**Approach**:
- Scan each file for Chinese characters (Unicode range `\u4e00-\u9fff`)
- Translate comments (not string literals intended for users)
- Keep user-facing Chinese strings unchanged (they're in string literals, not comments)

**New file**: `scripts/check-chinese.sh` — CI check script

---

## Detailed Design Deliverables

For each module, provide:

1. **File-by-file change list** (which files, what changes)
2. **Function signatures** (new functions/methods)
3. **Error handling** (what happens on failure)
4. **Test cases** (list of test scenarios)

---

## Important

- **DO NOT implement** — this is design only
- Focus on HOW to implement, not implementation
- Consider edge cases and error states
- The deliverable is a detailed design document, not code

---

## Deliverable

Write detailed design to `docs/design/v3.5.0-phase1-detailed.md`

---

## Project Location

`/Users/liantian/workspace/osprojects/deepclaw`