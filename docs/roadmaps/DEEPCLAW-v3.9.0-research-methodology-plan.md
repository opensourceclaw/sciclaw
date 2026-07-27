# DeepClaw v3.9.0 — Research Methodology Enhancement

**Author**: Friday (A)
**Date**: 2026-07-27
**Status**: 📋 Plan — Awaiting Peter Approval
**Project**: deepclaw
**Version**: 3.9.0

---

## 背景

DeepClaw 是**深度研究智能体**，不是软件开发智能体。应该采用**研究方法论**，而非软件工程方法论。

### 核心差异

| 维度 | DevClaw (软件工程) | DeepClaw (深度研究) |
|------|-------------------|-------------------|
| **核心任务** | 代码开发、构建、测试 | 信息检索、知识综合 |
| **产出物** | 源代码、测试、文档 | 研究报告、知识图谱 |
| **方法论** | SDLC + Engineering Gates | Research Pipeline + Research Gates |

---

## 目标

### Primary Goals

1. **定义 Deep Research Pipeline** - 研究流程标准化
2. **实现 Research Quality Gates** - 研究质量门禁
3. **集成共享基础设施** - claw-mem/claw-ctx/claw-obs

### Secondary Goals

4. **代码规范统一** - ESLint + Prettier
5. **发布流程标准化** - CI/CD + GitHub Release

---

## Deep Research Pipeline (研究流程)

### 流程阶段

```
┌─────────────────────────────────────────┐
│  OBSERVE (观察)                          │
│  - 发现研究主题                           │
│  - 定义研究问题                           │
│  - Gate: Topic Clarity Gate              │
└─────────────┬───────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  PLAN (规划)                             │
│  - 分解研究问题                           │
│  - 制定检索策略                           │
│  - Gate: Research Plan Gate              │
└─────────────┬───────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  SEARCH (检索)                           │
│  - 多源信息搜集                           │
│  - URL 去重                              │
│  - Gate: Source Credibility Gate         │
└─────────────┬───────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  EXTRACT (提取)                          │
│  - 结构化数据提取                         │
│  - 实体关系抽取                           │
│  - Gate: Extraction Quality Gate         │
└─────────────┬───────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  SYNTHESIZE (综合)                       │
│  - 知识融合                               │
│  - 论证构建                               │
│  - Gate: Cross-Validation Gate           │
└─────────────┬───────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  VALIDATE (验证)                         │
│  - 交叉验证                               │
│  - 偏见检测                               │
│  - Gate: Bias Detection Gate             │
└─────────────┬───────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  REPORT (报告)                           │
│  - 生成研究报告                           │
│  - 引用管理                               │
│  - Gate: Citation Integrity Gate         │
└─────────────────────────────────────────┘
```

---

## Research Quality Gates (研究质量门禁)

### Gate 定义

| Gate | 阶段 | 检查内容 | 阈值 |
|------|------|----------|------|
| **Topic Clarity Gate** | OBSERVE | 研究主题清晰度 | score ≥ 0.7 |
| **Research Plan Gate** | PLAN | 计划可行性 | score ≥ 0.8 |
| **Source Credibility Gate** | SEARCH | 来源可信度 | avg ≥ 0.7 |
| **Extraction Quality Gate** | EXTRACT | 提取完整性 | coverage ≥ 0.85 |
| **Cross-Validation Gate** | SYNTHESIZE | 多源一致性 | agreement ≥ 0.8 |
| **Bias Detection Gate** | VALIDATE | 偏见检测 | bias_score ≤ 0.3 |
| **Citation Integrity Gate** | REPORT | 引用准确性 | accuracy ≥ 0.95 |

### Gate 实现

```typescript
// src/gate/research/
├── source-credibility-gate.ts
├── cross-validation-gate.ts
├── bias-detection-gate.ts
├── citation-integrity-gate.ts
└── research-gate-registry.ts
```

---

## Scope

### P0: 共享基础设施集成

**目标**：集成 claw-* 组件

**新增依赖**：
```json
{
  "dependencies": {
    "claw-mem": "file:../claw-mem",
    "claw-ctx": "file:../claw-ctx",
    "claw-obs": "file:../claw-obs"
  }
}
```

**新增文件**：
- `src/memory/DeepClawMemoryAdapter.ts` — 使用 claw-mem
- `src/context/ContextManager.ts` — 使用 claw-ctx
- `src/observe/MetricsCollector.ts` — 使用 claw-obs

---

### P1: Research Quality Gates 实现

**目标**：实现研究专用质量门禁

**新增文件**：
```
src/gate/research/
├── source-credibility-gate.ts       (来源可信度评分)
├── cross-validation-gate.ts          (交叉验证)
├── bias-detection-gate.ts            (偏见检测)
├── citation-integrity-gate.ts        (引用完整性)
└── research-gate-registry.ts         (门禁注册中心)
```

**功能**：
- `SourceCredibilityGate`: Domain authority, publication reputation, author expertise
- `CrossValidationGate`: Multi-source agreement, consistency checking
- `BiasDetectionGate`: Selection bias, confirmation bias, funding bias
- `CitationIntegrityGate`: Citation accuracy, reference completeness

---

### P2: Research Pipeline 增强

**目标**：完善研究流程阶段

**修改文件**：
- `src/orchestrator/research-state-machine.ts` — 增强状态机
- `src/agents/` — 各阶段 Agent 增强
  - `planning_agent.ts` → PLAN 阶段增强
  - `search_agent.ts` → SEARCH 阶段增强
  - `synthesis_agent.ts` → SYNTHESIZE 阶段增强

**新增**：
- `src/stages/observe.ts` — OBSERVE 阶段
- `src/stages/validate.ts` — VALIDATE 阶段

---

### P3: 代码规范统一

**目标**：统一代码风格

**新增文件**：
- `.eslintrc.json` — ESLint 配置
- `.prettierrc` — Prettier 配置
- `.eslintignore` — 忽略文件

---

### P4: 发布流程标准化

**目标**：规范化发布

**新增**：
- `.github/workflows/release.yml` — GitHub Release 工作流
- `RELEASE_CHECKLIST.md` — 发布检查清单（已有，需更新）

---

## 实施计划

| Phase | 任务 | 工期 | 优先级 |
|:-----:|------|:----:|:------:|
| Phase 1 | P0: 共享基础设施集成 | 2 天 | P0 |
| Phase 2 | P1: Research Quality Gates | 3 天 | P1 |
| Phase 3 | P2: Research Pipeline 增强 | 2 天 | P1 |
| Phase 4 | P3: 代码规范统一 | 1 天 | P2 |
| Phase 5 | P4: 发布流程标准化 | 1 天 | P2 |

**总计**：约 9 天

---

## 验收标准

### 功能验收

- [ ] claw-mem 集成（记忆持久化）
- [ ] claw-ctx 集成（上下文优化）
- [ ] claw-obs 集成（监控指标）
- [ ] Source Credibility Gate 实现并测试
- [ ] Cross-Validation Gate 实现并测试
- [ ] Bias Detection Gate 实现并测试
- [ ] Citation Integrity Gate 实现并测试
- [ ] Research Pipeline 7 阶段完整

### 质量验收

- [ ] `npm run build` 通过
- [ ] `npm test` 通过（无回归）
- [ ] 新增测试覆盖 Gates ≥ 80%
- [ ] ESLint 检查通过
- [ ] Prettier 格式化完成

### 文档验收

- [ ] Research Pipeline 文档更新
- [ ] Research Gates 文档新增
- [ ] CHANGELOG.md 更新
- [ ] README.md 更新

---

## 版本更新

v3.8.0 → v3.9.0

**Breaking Changes**: None (向后兼容)

---

## 与 DevClaw 的关系

### 共享基础设施

```
共享层 (claw-*)
├── claw-mem    (记忆系统)
├── claw-ctx    (上下文管理)
└── claw-obs    (监控指标)

DevClaw (软件工程)      DeepClaw (深度研究)
├── SDLC Pipeline       ├── Research Pipeline
├── Engineering Gates   ├── Research Gates
└── Code Quality        └── Information Quality
```

### 不共享的部分

| DevClaw 专用 | DeepClaw 专用 |
|-------------|---------------|
| Design Review Gate | Source Credibility Gate |
| Code Review Gate | Cross-Validation Gate |
| Test Gate | Bias Detection Gate |
| Coverage Gate | Citation Integrity Gate |

---

## 风险

| 风险 | 缓解措施 |
|------|----------|
| claw-mem 集成复杂 | 使用 Adapter 模式隔离 |
| Gate 实现成本高 | 优先实现 P0 Gates |
| 测试覆盖不足 | 每个 Gate 配套测试 |

---

## 成功指标

### 质量指标

| 指标 | 当前 | 目标 |
|------|:----:|:----:|
| Gate 覆盖率 | 0% | 100% (4 Gates) |
| 测试覆盖率 | ? | ≥ 85% |
| 代码规范 | 无 | ESLint + Prettier |

### 研究质量指标

| 指标 | 说明 | 目标 |
|------|------|:----:|
| Source Credibility | 平均来源可信度 | ≥ 0.75 |
| Cross-Validation Agreement | 多源一致性 | ≥ 0.80 |
| Citation Accuracy | 引用准确性 | ≥ 0.95 |

---

## 下一步

1. ⏳ 等待 Peter 审批
2. 📋 审批通过后启动 Phase 1
3. 📋 创建详细的 Phase 实施计划

---

*Plan created by Friday (A) — 2026-07-27*
*Methodology: Deep Research (not Software Engineering)*
