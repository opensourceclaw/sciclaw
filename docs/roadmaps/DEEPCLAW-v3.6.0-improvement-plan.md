# DeepClaw 改进计划 — DevClaw 方法论对齐

**Author**: Friday (A)
**Date**: 2026-07-19
**Status**: Plan — Awaiting Peter Approval
**Project**: deepclaw

---

## 背景

根据 DevClaw 方法论对 DeepClaw 进行全面评估，发现以下问题：

| 维度 | 评分 | 问题 |
|------|:----:|------|
| 9 Stage Pipeline | 3/9 | 缺少 OBSERVE/GOVERN |
| Quality Gates | 2/6 | 无 Design/Code Review Gate |
| 代码质量 | 6/10 | 无 ESLint |
| 依赖使用 | 2/10 | 未使用 DevClaw/claw-mem/claw-cog |

---

## 目标

让 DeepClaw 对齐 DevClaw 方法论，提升工程质量。

---

## Scope

### P0: 添加 DevClaw 依赖

**目标**：集成 DevClaw 核心能力

**修改**：
```json
{
  "dependencies": {
    "devclaw": "file:../devclaw",
    "claw-mem": "file:../claw-mem",
    "claw-cog": "file:../claw-cog"
  }
}
```

**新增文件**：
- `src/memory-adapter.ts` — 使用 claw-mem
- `src/cog-integration.ts` — 使用 claw-cog

---

### P1: 完善 Quality Gates

**目标**：添加设计审查和代码审查流程

**新增**：
- inbox-design-review/ — 设计审查
- inbox-code-review/ — 代码审查
- `src/gate/design-review-gate.ts`
- `src/gate/code-review-gate.ts`

---

### P2: 添加 ESLint + Prettier

**目标**：统一代码规范

**新增文件**：
- `.eslintrc.json`
- `.prettierrc`
- `.eslintignore`

---

### P3: 添加 OBSERVE + GOVERN 阶段

**目标**：实现持续改进闭环

**新增**：
- `src/observe/metrics-collector.ts`
- `src/governance/rsi-bridge.ts`

---

### P4: 完善发布流程

**目标**：标准化发布

**修改**：
- 更新 CHANGELOG.md
- 添加 GitHub Release 工作流

---

## 实施计划

| Phase | 任务 | 工期 |
|:-----:|------|:----:|
| Phase 1 | 添加 DevClaw 依赖 | Day 1 |
| Phase 2 | 完善 Quality Gates | Day 2-3 |
| Phase 3 | 添加 ESLint + Prettier | Day 4 |
| Phase 4 | 添加 OBSERVE + GOVERN | Day 5-6 |
| Phase 5 | 完善发布流程 | Day 7 |

---

## 验收标准

- [ ] DevClaw 依赖集成
- [ ] Quality Gates 完善
- [ ] ESLint + Prettier 配置
- [ ] OBSERVE + GOVERN 实现
- [ ] npm run build 通过
- [ ] npm test 通过 (无回归)

---

## 版本更新

v3.5.0 → v3.6.0

---

## 风险

| 风险 | 缓解措施 |
|------|----------|
| 依赖冲突 | 先在隔离环境测试 |
| 破坏现有功能 | 保持向后兼容 |

---

*Plan created by Friday (A) — 2026-07-19*
