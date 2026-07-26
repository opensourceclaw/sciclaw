# Requirements Document: DeepClaw v3.7.0

**Project**: deepclaw
**Version**: 3.8.0
**Date**: 2026-07-27
**Stage**: PLAN

---

## 1. Project Overview

### 1.1 Vision

**DeepClaw** 是一个开源的深度研究框架，让 AI 成为每个人的研究伙伴。

### 1.2 Mission

提供可信的、开源的、持续进化的深度研究能力。

### 1.3 Version Goals

**v3.8.0 主题**: Flow Separation - 深度研究流程分离

---

## 2. Problem Statement

### 2.1 Current Situation

DeepClaw v3.6.0 使用统一的 Orchestrator 处理所有研究任务，无法区分：
- **深度研究** (Deep Research): 交互式、需要人工审批、深度优先
- **自动研究** (Auto Research): 自动化、无需审批、广度优先

### 2.2 Pain Points

1. **用户需求差异化**
   - 复杂研究需要人工监督
   - 简单研究希望快速自动化

2. **流程控制不足**
   - 无法在不同研究类型间切换
   - Gate 策略无法定制

3. **用户体验不佳**
   - 所有研究都使用相同流程
   - 无法根据需求选择策略

---

## 3. Requirements

### 3.1 Functional Requirements

#### FR-1: DeepResearchFlow Class

**Priority**: P0

**Description**: 创建独立的深度研究流程类

**Acceptance Criteria**:
- [ ] 支持 5 个主要阶段：plan → search → analyze → synthesize → report
- [ ] 每个阶段支持人工审批
- [ ] 深度优先的研究策略
- [ ] 交互式确认机制

#### FR-2: CLI Mode Flag

**Priority**: P0

**Description**: 添加命令行模式选择

**Acceptance Criteria**:
- [ ] `--mode deep` 选择深度研究模式
- [ ] `--mode auto` 选择自动研究模式
- [ ] 默认模式为 `deep`
- [ ] 模式选择影响流程执行

#### FR-3: Gate Strategy

**Priority**: P1

**Description**: 支持不同的 Gate 策略

**Acceptance Criteria**:
- [ ] DeepResearchGateStrategy - 人工审批
- [ ] AutoResearchGateStrategy - 自动审批
- [ ] 策略可配置

#### FR-4: Kernel Documentation

**Priority**: P2

**Description**: 文档化共享的研究内核

**Acceptance Criteria**:
- [ ] 识别共享组件
- [ ] 文档化组件接口
- [ ] 明确复用边界

---

### 3.2 Non-Functional Requirements

#### NFR-1: Performance

- 深度研究响应时间 < 10s (每个阶段)
- 自动研究完成时间 < 5min

#### NFR-2: Maintainability

- 代码遵循 DevClaw 9-Stage Model
- 测试覆盖率 > 80%

#### NFR-3: Compatibility

- 向后兼容 v3.6.0
- 不破坏现有 API

---

## 4. Architecture Design

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────┐
│           CLI / API Entry Point          │
├─────────────────────────────────────────┤
│  Mode Selection (--mode deep|auto)      │
└─────────────┬───────────────────────────┘
              │
        ┌─────┴─────┐
        ▼           ▼
┌───────────────┐ ┌───────────────┐
│DeepResearch   │ │AutoResearch   │
│Flow           │ │Flow           │
│- Interactive  │ │- Autonomous   │
│- Human        │ │- Auto-approve │
│  Approval     │ │- Fast         │
└───────┬───────┘ └───────┬───────┘
        │                 │
        └────────┬────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Research Kernel (Shared Components)    │
│  - PlanningAgent                        │
│  - SearchAgent                          │
│  - SynthesisAgent                       │
│  - WritingAgent                         │
│  - Extractor / Knowledge                │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Gate System                            │
│  - DeepResearchGateStrategy             │
│  - AutoResearchGateStrategy             │
└─────────────────────────────────────────┘
```

### 4.2 Component Design

#### 4.2.1 DeepResearchFlow

```typescript
class DeepResearchFlow {
  // State
  currentStage: 'plan' | 'search' | 'analyze' | 'synthesize' | 'report';
  researchPlan: ResearchPlan;
  
  // Core Methods
  async start(topic: string): Promise<void>;
  async plan(): Promise<ResearchPlan>;
  async search(): Promise<SearchResult[]>;
  async analyze(): Promise<AnalysisResult>;
  async synthesize(): Promise<SynthesisResult>;
  async report(): Promise<ResearchReport>;
  
  // Gate Methods
  async requestApproval(step: string): Promise<boolean>;
}
```

#### 4.2.2 Gate Strategies

```typescript
interface GateStrategy {
  name: string;
  getGates(): Gate[];
  shouldApprove(stage: string): boolean;
}

class DeepResearchGateStrategy implements GateStrategy {
  // Human approval required
}

class AutoResearchGateStrategy implements GateStrategy {
  // Auto-approve all
}
```

### 4.3 Data Flow

```
User Input (topic + --mode)
    │
    ▼
Mode Router
    │
    ├─ deep → DeepResearchFlow
    │           ├─ Plan (research plan)
    │           ├─ Gate: Human Approval ✓
    │           ├─ Search (sources)
    │           ├─ Gate: Human Approval ✓
    │           ├─ Analyze (insights)
    │           ├─ Gate: Human Approval ✓
    │           ├─ Synthesize (report draft)
    │           ├─ Gate: Human Approval ✓
    │           └─ Report (final)
    │
    └─ auto → AutoResearchFlow
                ├─ Plan (research plan)
                ├─ Auto-approve ✓
                ├─ Search (sources)
                ├─ Auto-approve ✓
                ├─ Analyze (insights)
                ├─ Auto-approve ✓
                ├─ Synthesize (report draft)
                ├─ Auto-approve ✓
                └─ Report (final)
```

---

## 5. Implementation Plan

### 5.1 Phase Breakdown

| Phase | Tasks | Duration | Priority |
|-------|-------|:--------:|:--------:|
| **Phase 1** | DeepResearchFlow Class | 2-3 days | P0 |
| **Phase 2** | CLI Mode Flag | 1 day | P0 |
| **Phase 3** | Gate Strategy | 1-2 days | P1 |
| **Phase 4** | Kernel Documentation | 1 day | P2 |
| **Phase 5** | Tests + Documentation | 1-2 days | P0 |

### 5.2 Dependencies

```
Phase 1 (DeepResearchFlow) ─┐
                             ├─→ Phase 3 (Gate Strategy)
Phase 2 (CLI Mode Flag) ────┘
                             │
                             └─→ Phase 4 (Kernel Docs)
                                      │
                                      └─→ Phase 5 (Tests + Docs)
```

---

## 6. Success Metrics

| Metric | Target |
|--------|:------:|
| Test Coverage | > 80% |
| Code Review Passed | ✅ |
| Build Success | ✅ |
| Documentation Complete | 100% |
| Backward Compatibility | ✅ |

---

## 7. Risks and Mitigation

| Risk | Impact | Mitigation |
|------|:------:|------------|
| Breaking existing API | High | Maintain backward compatibility |
| Performance regression | Medium | Benchmark before/after |
| Gate strategy complexity | Medium | Start with simple strategies |

---

## 8. Approval

**Status**: ⏳ Waiting for Peter Approval

**Approval Required From**: Peter Cheng

---

*Created by Friday AI — 2026-07-27*
*Pipeline ID: deepclaw-v3.8.0*
*Current Stage: PLAN*
