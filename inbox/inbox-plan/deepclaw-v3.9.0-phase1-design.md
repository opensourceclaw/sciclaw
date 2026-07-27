# Design: DeepClaw v3.9.0 Phase 1 - Infrastructure Integration

**Author**: Friday (A)
**Date**: 2026-07-27
**Status**: 📐 DESIGN Stage
**Project**: deepclaw
**Version**: v3.9.0

---

## 1. Scope Overview

Phase 1 集成共享基础设施：
- claw-ctx：上下文管理
- claw-obs：监控指标

**已集成**: claw-mem (v3.8.0)

---

## 2. Architecture

### 2.1 Component View

```
DeepClaw v3.9.0
├── src/
│   ├── memory/
│   │   └── DeepClawMemoryAdapter.ts  (已存在 - 使用 claw-mem)
│   ├── context/                      (新增)
│   │   ├── ContextManager.ts         (使用 claw-ctx)
│   │   └── ResearchContext.ts        (研究上下文类型)
│   └── observe/                      (新增)
│       ├── MetricsCollector.ts       (使用 claw-obs)
│       └── ResearchMetrics.ts        (研究指标类型)
```

### 2.2 Dependency Updates

```json
{
  "dependencies": {
    "claw-ctx": "file:../claw-ctx",
    "claw-obs": "file:../claw-obs"
  }
}
```

---

## 3. Component Design

### 3.1 ContextManager

**职责**:
- 管理研究上下文
- 优化 token 使用
- 提供模型感知的上下文策略

**接口**:
```typescript
export interface ContextManager {
  // 上下文优化
  optimizeContext(context: ResearchContext): Promise<OptimizedContext>;
  
  // 模型感知
  setModelProfile(profile: ModelProfile): void;
  
  // 状态管理
  getState(): ContextState;
  setState(state: ContextState): void;
}
```

**实现要点**:
- 使用 claw-ctx 的 `ModelAwareOptimizer`
- 定义 `ResearchContext` 类型（区别于 DevClaw 的代码上下文）

### 3.2 MetricsCollector

**职责**:
- 收集研究性能指标
- 报告到监控后端
- 支持告警

**接口**:
```typescript
export interface MetricsCollector {
  // 指标收集
  recordSearchLatency(source: string, latencyMs: number): void;
  recordExtractionQuality(docId: string, score: number): void;
  recordGateResult(gateName: string, passed: boolean): void;
  
  // 报告
  getMetrics(): ResearchMetrics;
  flush(): Promise<void>;
}
```

**实现要点**:
- 使用 claw-obs 的 `Observer` 和 `MetricsBackend`
- 定义研究专用指标

---

## 4. Type Definitions

### 4.1 ResearchContext

```typescript
export interface ResearchContext {
  // 研究主题
  topic: string;
  
  // 研究问题
  questions: string[];
  
  // 检索结果
  searchResults: SearchResult[];
  
  // 提取数据
  extractions: Extraction[];
  
  // 综合报告
  synthesis?: Synthesis;
}
```

### 4.2 ResearchMetrics

```typescript
export interface ResearchMetrics {
  // 检索指标
  searchLatency: Map<string, number[]>;
  searchCount: number;
  
  // 提取指标
  extractionQuality: Map<string, number>;
  
  // Gate 指标
  gateResults: Map<string, { passed: number; failed: number }>;
  
  // 资源指标
  tokenUsage: number;
  memoryUsage: number;
}
```

---

## 5. Integration Points

### 5.1 claw-ctx Integration

```typescript
// src/context/ContextManager.ts
import { ModelAwareOptimizer, ModelProfile } from 'claw-ctx';

export class ContextManager implements ContextManagerInterface {
  private optimizer: ModelAwareOptimizer;
  private modelProfile: ModelProfile;
  
  constructor(config?: ContextConfig) {
    this.optimizer = new ModelAwareOptimizer(config?.optimizerConfig);
    this.modelProfile = config?.modelProfile ?? DEFAULT_RESEARCH_PROFILE;
  }
  
  async optimizeContext(context: ResearchContext): Promise<OptimizedContext> {
    return this.optimizer.optimize(context, this.modelProfile);
  }
}
```

### 5.2 claw-obs Integration

```typescript
// src/observe/MetricsCollector.ts
import { Observer, MetricsBackend } from 'claw-obs';

export class MetricsCollector implements MetricsCollectorInterface {
  private observer: Observer;
  
  constructor(backend?: MetricsBackend) {
    this.observer = new Observer({ backend });
  }
  
  recordSearchLatency(source: string, latencyMs: number): void {
    this.observer.recordMetric('search_latency', latencyMs, { source });
  }
}
```

---

## 6. File Changes

| 文件 | 操作 | 说明 |
|------|:----:|------|
| `package.json` | 修改 | 添加 claw-ctx, claw-obs 依赖 |
| `src/context/ContextManager.ts` | 新增 | 上下文管理器 |
| `src/context/ResearchContext.ts` | 新增 | 研究上下文类型 |
| `src/context/index.ts` | 新增 | 导出 |
| `src/observe/MetricsCollector.ts` | 新增 | 指标收集器 |
| `src/observe/ResearchMetrics.ts` | 新增 | 研究指标类型 |
| `src/observe/index.ts` | 新增 | 导出 |

---

## 7. Testing Requirements

| 测试文件 | 测试数 | 覆盖内容 |
|----------|:------:|----------|
| `tests/context/ContextManager.test.ts` | 10+ | 上下文优化、模型感知 |
| `tests/observe/MetricsCollector.test.ts` | 10+ | 指标收集、报告 |

---

## 8. Acceptance Criteria

- [ ] claw-ctx 集成成功
- [ ] claw-obs 集成成功
- [ ] ContextManager 实现并测试
- [ ] MetricsCollector 实现并测试
- [ ] `npm run build` 通过
- [ ] `npm test` 通过
- [ ] 无回归

---

## 9. Next Steps

1. **Friday**: 发送详细设计任务给 Jarvis
2. **Jarvis**: 实现 Phase 1 代码
3. **Friday**: Design Review Gate
4. **Edith**: 测试验收

---

*Design by Friday (A) — 2026-07-27*
