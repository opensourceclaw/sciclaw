# Task: DeepClaw v3.8.0 Acceptance Test

**From**: Friday (A)
**To**: Edith (Test Agent)
**Date**: 2026-07-27
**Priority**: High
**Version**: v3.8.0

---

## 背景

DeepClaw v3.8.0 新增 Flow Separation 功能：
- DeepResearchFlow (交互式、深度优先)
- AutoResearchFlow (自动、广度优先)
- CLI `--mode` flag
- GateStrategy pattern

BUILD Stage 已通过，需要 Edith 独立验收。

---

## 验收范围

### 1. DeepResearchFlow

**文件**: `src/flows/deep_research_flow.ts`

**验收项**:
- [ ] 5 阶段流程正确 (plan → search → analyze → synthesize → report)
- [ ] pause/resume 功能正常
- [ ] Approval callback 工作正常
- [ ] 执行时间跟踪正确

### 2. AutoResearchFlow

**文件**: `src/flows/auto_research_flow.ts`

**验收项**:
- [ ] `run()` 方法正常工作
- [ ] 自动批准所有 Gate
- [ ] 返回 OrchestratorResult

### 3. CLI Mode Flag

**文件**: `src/cli/index.ts`

**验收项**:
- [ ] `--mode deep` 正常工作
- [ ] `--mode auto` 正常工作
- [ ] 无效 mode 报错

### 4. GateStrategy

**文件**: `src/gate/gate-strategy.ts`

**验收项**:
- [ ] DeepResearchGateStrategy.shouldApprove() 返回 false
- [ ] AutoResearchGateStrategy.shouldApprove() 返回 true
- [ ] createGateStrategy() factory 正确

---

## 测试命令

```bash
# Build
npm run build

# Unit tests
npm test

# Type check
npm run typecheck
```

---

## 验收标准

- [ ] npm run build 通过
- [ ] npm test 通过 (808 tests)
- [ ] 新功能测试覆盖完整
- [ ] 无回归问题

---

## 项目位置

`/Users/liantian/workspace/osprojects/deepclaw`

---

*Task created by Friday (A) — 2026-07-27*
