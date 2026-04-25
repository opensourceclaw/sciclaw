# Deep Research 项目讨论记录

**日期**: 2026-04-25
**参与**: Peter + Friday

---

## 一、背景

Peter 计划启动一个基于 OpenClaw 的 Deep Research 项目，用于：
1. 市场上 Deep Research 产品均为商业化，开源社区空白
2. OpenClaw 社区缺乏深度研究工具
3. MBA 论文需要专业研究工具

---

## 二、阅读的参考文献

### 1. Deep Research 领域前沿论文
- WebThinker, CogGen, WebWeaver 等 16+ 篇论文
- 核心趋势：并行化、小模型、多模态融合、可靠性审计

### 2. OpenClaw 构建 Deep Research 可行性分析
- 技术匹配度：高度可行
- 关键优势：本地优先、隐私可控、社区生态

### 3. 深度研究智能体技术调研报告
- RL 范式：REINFORCE > PPO
- 记忆机制：GAM (JIT 即时编译)
- 评估基准：DR-Arena 动态评测

---

## 三、AGI 架构讨论

### Peter 的核心观点
```
AGI = AgentOS (小脑) + LLM DataOS (大脑)
```

| 组件 | 包含 |
|------|------|
| AgentOS (小脑) | neoclaw + claw-mem + claw-rl + OpenClaw |
| LLM DataOS (大脑) | DeepSeek / GLM / Minimax 等 |

### 关键补充：价值对齐层
- 当 AgentOS 与 LLM DataOS 冲突时，需要价值仲裁机制
- 已实现：UserValueStore + EthicsRuleBase + ConflictArbitrator

---

## 四、项目定位讨论

### 选项对比

| 选项 | 优点 | 缺点 |
|------|------|------|
| 新项目 deepclaw | 高独立性 | 需从零开始 |
| neoclaw 插件 | 复用 12 Agent | 依赖 neoclaw |

### 建议方案：双层插件

```
Deep Research
    ├── OpenClaw Skill：轻量快速原型
    └── neoclaw 插件：深度研究能力
```

**起步建议**：先做 OpenClaw Skill（快速验证 MVP）

---

## 五、价值对齐层完成

### 本周完成的工作

| 项目 | 状态 |
|------|------|
| neoclaw v2.2.0 HKAA | ✅ 12 Agents |
| claw-rl v2.2.0 | ✅ 规则提取+Pareto+可移植性 |
| 价值对齐层 Phase 1-3 | ✅ 全部完成 |

### 价值对齐层组件

| Phase | 组件 | 功能 |
|-------|------|------|
| Phase 1 | UserValueStore, EthicsRuleBase, ConflictArbitrator | MVP |
| Phase 2 | ValueLearner, ScenarioRules, FeedbackHandler | 增强 |
| Phase 3 | ValueReasoner, ValueBackup, AuditLogger | 成熟 |

---

## 六、待继续讨论

- [ ] Deep Research 项目正式规划
- [ ] 技术选型确认
- [ ] MVP 功能定义

---

**记录时间**: 2026-04-25 00:33
**状态**: 待继续
