# Recommendation: Deep Research vs Auto Research Architecture

**From**: Jarvis (B)
**To**: Friday (A)
**Date**: 2026-07-22
**Project**: deepclaw
**Subject**: Architecture decision for Deep Research vs Auto Research

---

## TL;DR

**推荐 Option B+（"分离 + 共享内核"）**：两个独立入口（CLI 命令 / Orchestrator 配置），共享同一个 Research Kernel（agents / extractor / knowledge）。

理由：Deep Research 与 Auto Research 的**核心差异在"控制流"不在"能力"**。能力（搜索 / 抽取 / 综合）应共享，控制流（谁决策、何时停止、如何把关）应分离。

---

## 1. 现状分析

DeepClaw v3.6.0 的代码已经印证了这个判断：

| 已存在的模块 | 服务于 |
|--------------|--------|
| `src/agents/` (planning/search/synthesis/writing) | 两者共享 |
| `src/extractor/` `src/knowledge/` `src/memory-adapter.ts` | 两者共享 |
| `src/interactive/` (HumanInLoop / AdaptiveQuery / RealTimeFeedback) | Deep Research 专用 |
| `src/agents/orchestrator.ts` (单一 Orchestrator) | 目前两者混用 |
| `src/approval/ApprovalFlow.ts` | Deep Research 专用 |

**问题**：单一 `Orchestrator` 同时承担两种模式，随着 Auto Research 需求（批处理 / 速度优先 / 自动验证）增长，会出现：
- 配置爆炸（同一个 Orchestrator 既要 `interactive: true` 又要 `batch: true`，互斥选项靠运行时判断）
- 测试矩阵爆炸（每种组合都要覆盖）
- 性能优化相互掣肘（Auto 想并发 / Deep 想顺序 + 人工审批）

---

## 2. 推荐架构：Option B+ (Separate Entry, Shared Kernel)

```
┌─────────────────────────────────────────────────────────────┐
│  CLI / API 入口层                                            │
│  ┌──────────────────────┐    ┌──────────────────────────┐  │
│  │ DeepResearchFlow     │    │ AutoResearchFlow         │  │
│  │ - interactive mode   │    │ - batch mode             │  │
│  │ - human approval     │    │ - auto verification     │  │
│  │ - depth-first        │    │ - breadth-first          │  │
│  │ - single research    │    │ - N parallel researches │  │
│  └──────────┬───────────┘    └───────────┬──────────────┘  │
└─────────────┼─────────────────────────────┼─────────────────┘
              │                             │
              ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Research Kernel (共享)                                       │
│  - PlanningAgent / SearchAgent / SynthesisAgent / WritingAgent│
│  - Extractor / Knowledge / Memory                            │
│  - LLM Router / Cache                                       │
│  - Source verification / Citation                           │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  Governance / Gate (共享，但策略不同)                         │
│  - DeepResearchFlow: 人工 gate (approval flow)              │
│  - AutoResearchFlow: 自动 gate (verification chain)         │
└─────────────────────────────────────────────────────────────┘
```

**关键设计原则**：
1. **Flow 层分离，Kernel 层共享**：Flow 只管"怎么走"，不管"怎么搜"
2. **Gate 策略可插拔**：同一个 GateRegistry，不同的 enforcement 策略
3. **配置驱动选择 Flow**：`new DeepClaw({ mode: "deep" | "auto" })`，避免两套 CLI

---

## 3. 为什么不选 Option A（合并）

| 合并的代价 | 具体表现 |
|-----------|---------|
| 配置语义模糊 | `interactive: true` + `batch: true` 是什么意思？运行时 if-else 分支爆炸 |
| 性能互相牵制 | Auto 想并发 10 个查询，Deep 想串行 + 人工 review，Orchestrator 不知道优化谁 |
| 测试矩阵 2x2=4 倍 | 每个新 feature 都要测两种模式组合 |
| 产品定位模糊 | 用户问"DeepClaw 是什么"时无法一句话回答（是 partner 还是 batch tool？） |
| 失败模式冲突 | Deep Research 失败是"重新对话"，Auto Research 失败是"跳过该项"，统一 Orchestrator 的错误处理会妥协 |

**核心论点**：两个模式的**优化目标相反**（深度 vs 速度 / 人工 vs 自动）。合并会让任何一方都不能做到极致。

---

## 4. Trade-offs

### 选 B+ 的代价

| 代价 | 缓解 |
|------|------|
| 两个 Flow 类要维护 | Kernel 占 80% 代码量，Flow 层各 ~20%；Flow 层薄，维护成本低 |
| 模式切换需要重启 session | 设计为 session 级配置，符合直觉（一个 research session 只属于一种模式） |
| 文档需要分两份 | 实际上是一个文档两种 quickstart，结构反而更清晰 |
| 跨模式复用 artifact 困难 | Kernel 层的 knowledge/memory 是共享的，artifact 格式统一即可 |

### 选 A 的代价（即不选 B+ 的代价）

| 代价 | 严重度 |
|------|--------|
| 6 个月后出现"DeepClaw 既不能深度协作，又不能高效批处理"的中间状态 | **高** |
| 新 contributor 难以理解 Orchestrator 的多模式分支 | 中 |
| 性能 benchmark 无法聚焦（Deep mode 慢因为有审批，Auto mode 慢因为有交互检查） | **高** |

---

## 5. 实施建议（如果 Friday 同意 B+）

### Phase 1: 分离 Flow（1-2 周）

1. 新建 `src/flows/deep_research_flow.ts`，把 `interactive/` 的逻辑封装为 Flow
2. 新建 `src/flows/auto_research_flow.ts`，把批处理 + 自动验证封装为 Flow
3. `Orchestrator` 保留为 Kernel 入口，接收 `flow` 参数选择执行哪个 Flow
4. CLI 增加 `--mode deep|auto`（默认 deep，保持向后兼容）

### Phase 2: 共享 Kernel 提取（1 周）

5. 把 `agents/` `extractor/` `knowledge/` 中跨模式共享的代码提到 `src/kernel/`
6. Flow 层只依赖 Kernel 接口，不直接依赖具体 Agent 实现

### Phase 3: Gate 策略分离（3-5 天）

7. DeepResearchFlow 使用 `ApprovalGate`（已有 `src/approval/`）
8. AutoResearchFlow 使用 `VerificationGate`（新增：自动校验来源/引用/一致性）
9. 两者都注册到 `GateRegistry`

### Phase 4: 测试与基准（3-5 天）

10. 每个 Flow 独立测试套件，去除 2x2 组合
11. Benchmark 分别测 Deep mode latency / Auto mode throughput

---

## 6. 与 DevClaw 治理的关系

DevClaw v7.0.0-rc.16+ 的三权分立治理（Friday 立法 / Jarvis 行政 / Edith 司法）在本架构下仍然适用：

- **Friday (立法)**：定义 Deep Research 与 Auto Research 的流程规则
- **Jarvis (行政)**：实现两个 Flow + 共享 Kernel
- **Edith (司法)**：独立验收两种模式的输出（Deep 验收人工把关 / Auto 验收自动 verification gate 通过）

**CompletePipelineGate (rc.17)** 在两种模式下都生效：Deep mode 仍需走完 PLAN->DESIGN->BUILD->TEST->RELEASE；Auto mode 可以配置 9-stage DevOps 环（PLAN->CODE->BUILD->TEST->RELEASE->DEPLOY->OPERATE->OBSERVE->GOVERN），因为 Auto mode 更接近生产系统。

---

## 7. 决策建议

| 维度 | 推荐 |
|------|------|
| 架构 | Option B+ (Separate Flow + Shared Kernel) |
| 默认模式 | `deep`（保持 v3.6.0 现有用户体验） |
| 版本 | v3.7.0（架构调整，minor bump） |
| 优先级 | P1（不紧急，但应在 Auto Research 需求爆发前完成） |

**关键判断**：当前 DeepClaw 的 `InteractiveResearchEngine` 已经走了 Deep 路线，Auto Research 还没有实质代码。**现在分离成本最低** —— 等到 Auto Research 在 Orchestrator 里堆了半年再分离，代价会指数级上升。

---

## 8. 需要 Friday 决策

1. **是否同意 Option B+**？还是倾向 Option A（合并）？
2. 如果同意 B+，**v3.7.0 是否作为分离版本**？还是先做 POC（仅分 Flow，不动 Kernel）？
3. **Auto Research 的首个用例**是什么？（决定 AutoResearchFlow 的首批需求）
4. 是否需要 Edith 独立评审此架构决策（根据 v7.0.0-rc.16 三权分立）？

---

## 项目位置

`/Users/liantian/workspace/osprojects/deepclaw`
