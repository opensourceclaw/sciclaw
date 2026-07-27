# Design: DeepClaw v3.9.0 Phase 3 - Research Pipeline Enhancement

**Author**: Friday (A)
**Date**: 2026-07-27
**Status**: 📐 DESIGN Stage
**Project**: deepclaw
**Version**: v3.9.0 Phase 3

---

## 1. Scope Overview

Phase 3 增强 Research Pipeline，整合 Phase 1-2 的基础设施和 Gates。

**核心目标**:
1. 集成 Research Gates 到 Pipeline 流程
2. 增强 OBSERVE 和 VALIDATE 阶段
3. 实现完整的 7 阶段研究流程

---

## 2. Current State Analysis

### 2.1 现有 Pipeline (v3.8.0)

```
PLAN → SEARCH → ANALYZE → SYNTHESIZE → REPORT
```

**缺失**:
- OBSERVE 阶段（发现研究主题）
- VALIDATE 阶段（交叉验证）

### 2.2 现有 Gates (v3.9.0 Phase 2)

| Gate | Stage | 已实现 |
|------|-------|:------:|
| SourceCredibilityGate | search | ✅ |
| CrossValidationGate | synthesize | ✅ |
| BiasDetectionGate | validate | ✅ |
| CitationIntegrityGate | report | ✅ |

**需要**: 将 Gates 集成到 Pipeline 执行流程

---

## 3. Architecture

### 3.1 Enhanced Pipeline (7 Stages)

```
OBSERVE (观察)
  ├── Discover research topic
  ├── Define research questions
  └── Gate: Topic Clarity Gate (optional, P2)
        ↓
PLAN (规划)
  ├── Decompose questions
  ├── Plan search strategy
  └── Gate: Research Plan Gate (optional, P2)
        ↓
SEARCH (检索)
  ├── Multi-source search
  ├── URL deduplication
  └── Gate: Source Credibility Gate ✅
        ↓
EXTRACT (提取)
  ├── Structured data extraction
  ├── Entity/relation extraction
  └── Gate: Extraction Quality Gate (optional, P2)
        ↓
SYNTHESIZE (综合)
  ├── Knowledge fusion
  ├── Argument construction
  └── Gate: Cross Validation Gate ✅
        ↓
VALIDATE (验证)
  ├── Cross-validation
  ├── Bias detection
  └── Gate: Bias Detection Gate ✅
        ↓
REPORT (报告)
  ├── Generate report
  ├── Citation management
  └── Gate: Citation Integrity Gate ✅
```

### 3.2 Component View

```
src/
├── stages/
│   ├── observe.ts          (新增)
│   ├── plan.ts             (增强)
│   ├── search.ts           (增强 - 集成 Gate)
│   ├── extract.ts          (增强)
│   ├── synthesize.ts       (增强 - 集成 Gate)
│   ├── validate.ts         (新增 - 集成 Gate)
│   └── report.ts           (增强 - 集成 Gate)
├── orchestrator/
│   └── research-state-machine.ts  (增强 - 7 阶段)
└── flows/
    └── deep_research_flow.ts      (增强 - 集成 Gates)
```

---

## 4. Component Design

### 4.1 ResearchStateMachine Enhancement

**文件**: `src/orchestrator/research-state-machine.ts`

```typescript
import { researchGateRegistry } from '../gate/research/research-gate-registry.js';
import { metricsCollector } from '../observe/MetricsCollector.js';
import type { ResearchContext, ResearchStage } from '../context/ResearchContext.js';

export type ResearchState = 
  | 'observe' 
  | 'plan' 
  | 'search' 
  | 'extract' 
  | 'synthesize' 
  | 'validate' 
  | 'report'
  | 'complete';

const STAGE_ORDER: ResearchStage[] = [
  'observe', 'plan', 'search', 'extract', 
  'synthesize', 'validate', 'report'
];

export class ResearchStateMachine {
  private currentStage: ResearchStage = 'observe';
  private context: ResearchContext;
  private gateResults: Map<string, boolean> = new Map();
  
  constructor(initialContext: Partial<ResearchContext> = {}) {
    this.context = this.initContext(initialContext);
  }
  
  async transition(): Promise<{ success: boolean; stage: ResearchStage; gateResults?: Map<string, boolean> }> {
    // Run gates for current stage
    const gates = researchGateRegistry.getByStage(this.currentStage);
    
    for (const gate of gates) {
      const result = await gate.check(this.context);
      metricsCollector.recordGateResult(gate.name, result.passed);
      
      if (!result.passed) {
        return { 
          success: false, 
          stage: this.currentStage,
          gateResults: this.gateResults 
        };
      }
      
      this.gateResults.set(gate.name, result.passed);
    }
    
    // Transition to next stage
    const currentIndex = STAGE_ORDER.indexOf(this.currentStage);
    if (currentIndex < STAGE_ORDER.length - 1) {
      this.currentStage = STAGE_ORDER[currentIndex + 1];
      return { success: true, stage: this.currentStage };
    }
    
    // Pipeline complete
    return { success: true, stage: 'report' };
  }
  
  getStage(): ResearchStage {
    return this.currentStage;
  }
  
  getContext(): ResearchContext {
    return this.context;
  }
  
  updateContext(updates: Partial<ResearchContext>): void {
    this.context = { ...this.context, ...updates };
  }
  
  private initContext(initial: Partial<ResearchContext>): ResearchContext {
    return {
      topic: initial.topic ?? '',
      questions: initial.questions ?? [],
      searchResults: initial.searchResults ?? [],
      extractions: initial.extractions ?? [],
      stage: initial.stage ?? 'observe',
    };
  }
}
```

### 4.2 OBSERVE Stage

**文件**: `src/stages/observe.ts`

```typescript
import type { ResearchContext } from '../context/ResearchContext.js';

export interface ObserveResult {
  topic: string;
  questions: string[];
  scope: string;
}

export async function observeStage(input: string): Promise<ObserveResult> {
  // Extract topic from input
  const topic = extractTopic(input);
  
  // Generate research questions
  const questions = generateQuestions(topic, input);
  
  // Define scope
  const scope = defineScope(topic, questions);
  
  return { topic, questions, scope };
}

function extractTopic(input: string): string {
  // Simple extraction - could use LLM in production
  const sentences = input.split(/[.!?]/).filter(s => s.trim());
  return sentences[0]?.trim() ?? input.substring(0, 100);
}

function generateQuestions(topic: string, input: string): string[] {
  // Generate 3-5 research questions
  const words = topic.toLowerCase().split(/\s+/);
  const questions: string[] = [];
  
  questions.push(`What is ${topic}?`);
  questions.push(`What are the key aspects of ${words.slice(0, 3).join(' ')}?`);
  questions.push(`What are the latest developments in ${topic}?`);
  
  return questions.slice(0, 5);
}

function defineScope(topic: string, questions: string[]): string {
  return `Research scope: ${topic}, focusing on ${questions.length} key questions`;
}
```

### 4.3 VALIDATE Stage

**文件**: `src/stages/validate.ts`

```typescript
import { researchGateRegistry } from '../gate/research/research-gate-registry.js';
import { metricsCollector } from '../observe/MetricsCollector.js';
import type { ResearchContext } from '../context/ResearchContext.js';

export interface ValidationResult {
  isValid: boolean;
  biasReport: BiasReport;
  crossValidation: CrossValidationResult;
  recommendations: string[];
}

export interface BiasReport {
  selectionBias: number;
  confirmationBias: number;
  temporalBias: number;
  overall: number;
}

export interface CrossValidationResult {
  claimsWithSupport: number;
  claimsWithoutSupport: number;
  overallAgreement: number;
}

export async function validateStage(context: ResearchContext): Promise<ValidationResult> {
  // Run BiasDetectionGate
  const biasGate = researchGateRegistry.get('bias-detection')!;
  const biasResult = await biasGate.check(context);
  
  // Extract bias metrics
  const biasReport: BiasReport = {
    selectionBias: biasResult.details.find(d => d.item === 'selection')?.score ?? 0,
    confirmationBias: biasResult.details.find(d => d.item === 'confirmation')?.score ?? 0,
    temporalBias: biasResult.details.find(d => d.item === 'temporal')?.score ?? 0,
    overall: biasResult.score,
  };
  
  // Run CrossValidationGate
  const crossGate = researchGateRegistry.get('cross-validation')!;
  const crossResult = await crossGate.check(context);
  
  const crossValidation: CrossValidationResult = {
    claimsWithSupport: crossResult.details.filter(d => d.score >= 0.8).length,
    claimsWithoutSupport: crossResult.details.filter(d => d.score < 0.5).length,
    overallAgreement: crossResult.score,
  };
  
  // Record metrics
  metricsCollector.recordGateResult('bias-detection', biasResult.passed);
  metricsCollector.recordGateResult('cross-validation', crossResult.passed);
  
  const isValid = biasResult.passed && crossResult.passed;
  
  return {
    isValid,
    biasReport,
    crossValidation,
    recommendations: [...biasResult.recommendations ?? [], ...crossResult.recommendations ?? []],
  };
}
```

### 4.4 DeepResearchFlow Enhancement

**文件**: `src/flows/deep_research_flow.ts`

**关键修改**:
- 集成 ResearchStateMachine
- 7 阶段流程
- Gate 验证

```typescript
// 在现有 DeepResearchFlow 中添加

import { ResearchStateMachine } from '../orchestrator/research-state-machine.js';
import { observeStage } from '../stages/observe.js';
import { validateStage } from '../stages/validate.js';

export class DeepResearchFlow {
  private stateMachine: ResearchStateMachine;
  
  constructor() {
    this.stateMachine = new ResearchStateMachine();
  }
  
  async run(input: string): Promise<ResearchContext> {
    // OBSERVE
    const observeResult = await observeStage(input);
    this.stateMachine.updateContext({
      topic: observeResult.topic,
      questions: observeResult.questions,
    });
    
    // PLAN (existing logic)
    await this.transition('plan');
    
    // SEARCH (existing logic + Gate)
    await this.transition('search');
    
    // EXTRACT (existing logic)
    await this.transition('extract');
    
    // SYNTHESIZE (existing logic + Gate)
    await this.transition('synthesize');
    
    // VALIDATE (new stage)
    const validationResult = await validateStage(this.stateMachine.getContext());
    if (!validationResult.isValid) {
      // Handle validation failure
      console.warn('Validation failed:', validationResult.recommendations);
    }
    await this.transition('validate');
    
    // REPORT (existing logic + Gate)
    await this.transition('report');
    
    return this.stateMachine.getContext();
  }
  
  private async transition(stage: ResearchStage): Promise<boolean> {
    const result = await this.stateMachine.transition();
    if (!result.success) {
      throw new Error(`Gate failed at stage ${stage}`);
    }
    return true;
  }
}
```

---

## 5. File Changes

| 文件 | 操作 | 说明 |
|------|:----:|------|
| `src/orchestrator/research-state-machine.ts` | 修改 | 7 阶段 + Gate 集成 |
| `src/stages/observe.ts` | 新增 | OBSERVE 阶段 |
| `src/stages/validate.ts` | 新增 | VALIDATE 阶段 |
| `src/flows/deep_research_flow.ts` | 修改 | 集成 StateMachine + Gates |
| `src/stages/index.ts` | 新增 | 阶段导出 |

---

## 6. Testing Requirements

| 测试文件 | 测试数 | 覆盖内容 |
|----------|:------:|----------|
| `tests/orchestrator/ResearchStateMachine.test.ts` | 10 | 状态转换、Gate 集成 |
| `tests/stages/observe.test.ts` | 6 | 主题提取、问题生成 |
| `tests/stages/validate.test.ts` | 8 | 偏见报告、交叉验证 |
| `tests/flows/deep_research_flow_integration.test.ts` | 6 | 端到端流程 |

**Total**: 30 tests

---

## 7. Acceptance Criteria

- [ ] 7 阶段 Pipeline 完整
- [ ] OBSERVE 和 VALIDATE 阶段实现
- [ ] Gates 集成到 Pipeline
- [ ] ResearchStateMachine 实现
- [ ] `npm run build` 通过
- [ ] `npm test` 通过
- [ ] 新增测试 ≥ 30 个

---

## 8. Next Steps

1. **Friday**: 发送实现任务给 Jarvis
2. **Jarvis**: 实现 Phase 3 代码
3. **Friday**: Code Review
4. **Edith**: 测试验收

---

*Design by Friday (A) — 2026-07-27*
