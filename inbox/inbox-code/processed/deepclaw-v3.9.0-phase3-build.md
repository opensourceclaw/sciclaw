# Task: DeepClaw v3.9.0 Phase 3 - Research Pipeline Enhancement

**From**: Friday (A)
**To**: Jarvis (Builder)
**Date**: 2026-07-27
**Priority**: P1
**Version**: v3.9.0 Phase 3
**PipelineId**: deepclaw-v3.9.0-phase3

---

## 背景

Phase 3 增强 Research Pipeline，整合 Phase 1-2 的基础设施和 Gates：
- 7 阶段流程：OBSERVE → PLAN → SEARCH → EXTRACT → SYNTHESIZE → VALIDATE → REPORT
- Gate 集成到 Pipeline
- 新增 OBSERVE 和 VALIDATE 阶段

---

## 开发范围

### 1. ResearchStateMachine Enhancement

**文件**: `src/orchestrator/research-state-machine.ts`

**修改要点**:
- 支持 7 阶段
- 集成 ResearchGateRegistry
- Gate 验证
- MetricsCollector 集成

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
  
  getGateResults(): Map<string, boolean> {
    return new Map(this.gateResults);
  }
  
  reset(): void {
    this.currentStage = 'observe';
    this.gateResults.clear();
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

---

### 2. OBSERVE Stage

**文件**: `src/stages/observe.ts`

```typescript
import type { ResearchContext } from '../context/ResearchContext.js';

export interface ObserveResult {
  topic: string;
  questions: string[];
  scope: string;
}

export async function observeStage(input: string): Promise<ObserveResult> {
  const topic = extractTopic(input);
  const questions = generateQuestions(topic, input);
  const scope = defineScope(topic, questions);
  
  return { topic, questions, scope };
}

function extractTopic(input: string): string {
  const sentences = input.split(/[.!?]/).filter(s => s.trim().length > 0);
  return sentences[0]?.trim() ?? input.substring(0, 100);
}

function generateQuestions(topic: string, input: string): string[] {
  const words = topic.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const questions: string[] = [];
  
  questions.push(`What is ${topic}?`);
  
  if (words.length > 0) {
    questions.push(`What are the key aspects of ${words.slice(0, 3).join(' ')}?`);
  }
  
  questions.push(`What are the latest developments in ${topic}?`);
  questions.push(`What are the challenges in ${topic}?`);
  questions.push(`What are the future trends in ${topic}?`);
  
  return questions.slice(0, 5);
}

function defineScope(topic: string, questions: string[]): string {
  return `Research scope: ${topic}, addressing ${questions.length} key questions`;
}
```

---

### 3. VALIDATE Stage

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
  
  const biasReport: BiasReport = {
    selectionBias: biasResult.details.find(d => d.item === 'selection')?.score ?? 0,
    confirmationBias: biasResult.details.find(d => d.item === 'confirmation')?.score ?? 0,
    temporalBias: biasResult.details.find(d => d.item === 'temporal')?.score ?? 0,
    overall: biasResult.score,
  };
  
  // Run CrossValidationGate (also relevant for validation)
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
    recommendations: [...(biasResult.recommendations ?? []), ...(crossResult.recommendations ?? [])],
  };
}
```

---

### 4. Stage Exports

**文件**: `src/stages/index.ts`

```typescript
export * from './observe.js';
export * from './validate.js';
```

---

### 5. DeepResearchFlow Enhancement

**文件**: `src/flows/deep_research_flow.ts`

**在现有类中添加**:

```typescript
// Import new modules
import { ResearchStateMachine } from '../orchestrator/research-state-machine.js';
import { observeStage } from '../stages/observe.js';
import { validateStage } from '../stages/validate.js';

// Add to class
export class DeepResearchFlow {
  // ... existing properties ...
  private stateMachine: ResearchStateMachine | null = null;
  
  /**
   * Get current stage from state machine
   */
  getCurrentStageFromMachine(): ResearchStage | null {
    return this.stateMachine?.getStage() ?? null;
  }
  
  /**
   * Get gate results
   */
  getGateResults(): Map<string, boolean> {
    return this.stateMachine?.getGateResults() ?? new Map();
  }
  
  /**
   * Run observe stage
   */
  async runObserve(input: string): Promise<void> {
    const result = await observeStage(input);
    this.stateMachine?.updateContext({
      topic: result.topic,
      questions: result.questions,
    });
  }
  
  /**
   * Run validate stage
   */
  async runValidate(): Promise<ValidationResult> {
    if (!this.stateMachine) {
      throw new Error('State machine not initialized');
    }
    return validateStage(this.stateMachine.getContext());
  }
}
```

---

## 单元测试

| 测试文件 | 测试数 | 覆盖内容 |
|----------|:------:|----------|
| `tests/orchestrator/ResearchStateMachine.test.ts` | 10 | 状态转换、Gate 集成、context 更新 |
| `tests/stages/observe.test.ts` | 6 | 主题提取、问题生成、scope 定义 |
| `tests/stages/validate.test.ts` | 8 | 偏见报告、交叉验证、recommendations |
| `tests/flows/deep_research_flow_stages.test.ts` | 6 | 集成测试 |

**Total**: 30 tests

---

## 验收标准

- [ ] ResearchStateMachine 支持 7 阶段
- [ ] OBSERVE 阶段实现
- [ ] VALIDATE 阶段实现
- [ ] Gates 集成到 StateMachine
- [ ] `npm run build` 通过
- [ ] `npm test` 通过
- [ ] 新增测试 ≥ 30 个

---

## 项目位置

`/Users/liantian/workspace/osprojects/deepclaw`

---

## ⚠️ 重要提醒

- ❌ **不要创建 GitHub Release**
- ❌ **不要修改 package.json version**
- ✅ 只需实现代码和测试
- ✅ 完成后回复到 `inbox/inbox-friday/`

---

*Task created by Friday (A) — 2026-07-27*
