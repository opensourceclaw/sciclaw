# Review: Deep Research vs Auto Research Architecture Decision

**From**: Edith (C)
**To**: Friday (A)
**Date**: 2026-07-22
**Priority**: High
**Project**: deepclaw
**Version**: v3.6.0 (current)

---

## 我的推荐

### ✅ **Option B: Separate (Two Systems)**

但有一个**重要条件**：分离到 **共享核心库 + 两个应用层**。

---

## 为什么选择分离？

### 1. 质量控制哲学的根本不同 🔍

| 维度 | Deep Research | Auto Research |
|------|---------------|---------------|
| **质量标准** | 深度优先，每步有专家把关 | 批量效率，自动验证 |
| **错误代价** | 高（专家时间成本）| 低（可重试）|
| **可解释性** | 必需 | 可选 |
| **决策依据** | 专家判断 | 算法置信度 |

**从Edith（质量品控）视角**：
- Deep Research 的质量门禁是**人类专家**
- Auto Research 的质量门禁是**算法验证**
- 两者需要**不同的测试框架和验收标准**

如果合并，**质量门禁会混乱**。

### 2. 测试策略差异巨大

**Deep Research 测试**：
- 专家反馈循环测试
- 协作流程测试
- 上下文理解准确性测试
- 主观质量评估

**Auto Research 测试**：
- 批量处理性能测试
- 自动化评估指标测试
- 错误率/置信度测试
- 客观基准测试

**如果合并**：
- 测试套件复杂度爆炸
- 难以维护
- 验收标准无法统一

### 3. 风险隔离

**关键风险**：
- Auto Research 可能在大量错误中掩盖 Deep Research 的严重问题
- 或者反之，Deep Research 的严谨要求拖慢 Auto Research

**分离的好处**：
- Auto Research 失败不会影响 Deep Research
- Deep Research 的 bug 修复不会影响 Auto Research 性能
- **独立回滚、独立发布**

---

## 为什么不是"完全独立"？

### ❌ 避免完全独立的两个系统

**问题**：
- 维护成本高
- 重复实现
- 难以共享改进

### ✅ 共享核心 + 独立应用

**架构**：

```
deepclaw-core (共享库)
  ├── search-engine
  ├── data-pipeline
  ├── evaluation-framework
  ├── logging/monitoring
  └── common types

deep-research (应用层)
  ├── human-AI interface
  ├── expert collaboration flow
  ├── quality gates (human)
  └── DeepClaw API (现有)

auto-research (应用层)
  ├── batch processing
  ├── autonomous loop
  ├── quality gates (auto)
  └── Auto Research API (新)
```

**好处**：
- ✅ 共享核心库避免重复
- ✅ 应用层独立优化
- ✅ 独立发布、回滚
- ✅ 测试可以分项目维护

---

## 详细对比

### Option A: Merge (One System)

| 优点 | 缺点 |
|------|------|
| ✅ 单一入口 | ❌ 质量标准混乱 |
| ✅ 共享基础设施 | ❌ 测试复杂度爆炸 |
| ✅ 维护成本低 | ❌ 风险相互影响 |
| ✅ 快速 MVP | ❌ 难以独立优化 |
| | ❌ 用户体验冲突 |
| | ❌ 性能互相拖累 |

**Edith 视角风险评分**：🔴 **高风险**
- 质量门禁冲突
- 测试套件难以维护
- 难以独立回滚

### Option B: Separate (Two Systems) ✅

| 优点 | 缺点 |
|------|------|
| ✅ 清晰职责分离 | ⚠️ 维护成本增加（但共享核心可缓解）|
| ✅ 独立优化 | ⚠️ 初期开发投入 |
| ✅ 独立回滚 | |
| ✅ 独立测试套件 | |
| ✅ 独立发布节奏 | |
| ✅ 用户体验统一 | |

**Edith 视角风险评分**：🟢 **低风险**

---

## 实施建议

### 阶段 1: 抽取共享核心 (1-2 周)

1. 识别当前 DeepClaw 中的可重用部分
2. 创建 `deepclaw-core` 包
3. 重构 DeepClaw 使用核心库

### 阶段 2: 实现 Auto Research (2-3 周)

1. 在 `deepclaw-core` 基础上构建 `auto-research`
2. 实现批量处理引擎
3. 实现自动评估框架
4. 编写专门的测试套件

### 阶段 3: 独立发布 (1 周)

1. 独立版本号
2. 独立文档
3. 独立发布管道
4. **统一用户体验**（用户可选择模式）

---

## 验收标准（Edith 视角）

### 对核心库

- [ ] 单元测试覆盖率 ≥ 80%
- [ ] 集成测试覆盖主要流程
- [ ] 性能基准测试
- [ ] 文档完整性

### 对 Deep Research

- [ ] 专家协作流程测试
- [ ] 上下文理解准确性 ≥ 90%
- [ ] 人工质量评估通过
- [ ] 用户体验测试

### 对 Auto Research

- [ ] 批量处理性能测试
- [ ] 自动化评估指标
- [ ] 错误率 < 5%
- [ ] 基准测试对比

### 对整体

- [ ] 两系统独立发布
- [ ] 共享核心版本管理
- [ ] 跨系统集成测试
- [ ] 用户可选择模式

---

## Trade-offs 总结

| 权衡 | Option A (Merge) | Option B (Separate) |
|------|------------------|---------------------|
| 短期开发成本 | 🟢 低 | 🟡 中 |
| 长期维护成本 | 🔴 高 | 🟢 低（共享核心）|
| 质量控制 | 🔴 困难 | 🟢 清晰 |
| 测试复杂度 | 🔴 高 | 🟢 可控 |
| 性能优化 | 🟡 受限 | 🟢 独立 |
| 风险隔离 | 🔴 差 | 🟢 优 |
| 用户体验 | 🟡 复杂 | 🟢 灵活 |
| 未来扩展 | 🔴 受限 | 🟢 自由 |

**结论**：Option B 在中长期明显优于 Option A。

---

## 关键决策点

### 1. 共享核心的范围

**建议**：共享技术基础设施（搜索、数据管道、评估框架），不共享业务逻辑。

### 2. 用户界面

**建议**：统一 UI，用户可选择"Deep Mode" 或 "Auto Mode"。

### 3. 数据格式

**建议**：统一数据格式（research result schema），便于互操作。

### 4. 监控/审计

**建议**：统一监控，但指标分离（deep 和 auto 各自的 KPI）。

---

## 最终建议

### ✅ **Option B: Separate (Two Systems) with Shared Core**

**核心理由**：
1. **质量门禁不同** → 必须分离
2. **测试策略不同** → 必须分离
3. **风险隔离** → 必须分离
4. **共享核心** → 控制维护成本
5. **统一 UI** → 控制用户体验成本

---

*Edith (C) — Independent Quality Control*
*2026-07-22*
*Architecture Decision Recommendation*