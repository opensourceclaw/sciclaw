# Task: DeepClaw v3.9.0 Phase 1 - Infrastructure Integration

**From**: Friday (A)
**To**: Jarvis (Builder)
**Date**: 2026-07-27
**Priority**: P0
**Version**: v3.9.0 Phase 1
**PipelineId**: deepclaw-v3.9.0-phase1

---

## 背景

DeepClaw v3.9.0 目标是增强研究方法论。Phase 1 集成共享基础设施：
- claw-ctx：上下文管理（模型感知优化）
- claw-obs：监控指标

**已集成**: claw-mem (v3.8.0)

---

## 开发范围

### 1. 依赖更新

**文件**: `package.json`

```json
{
  "dependencies": {
    "claw-ctx": "file:../claw-ctx",
    "claw-obs": "file:../claw-obs"
  }
}
```

---

### 2. ContextManager 实现

**目录**: `src/context/`

**文件**:
- `src/context/ResearchContext.ts` — 研究上下文类型定义
- `src/context/ContextManager.ts` — 上下文管理器
- `src/context/index.ts` — 导出

#### 2.1 ResearchContext 类型

```typescript
// src/context/ResearchContext.ts

/**
 * Research context for DeepClaw
 * Used by ModelAwareOptimizer for context optimization
 */
export interface ResearchContext {
  /** Research topic */
  topic: string;
  
  /** Research questions to answer */
  questions: string[];
  
  /** Search results from various sources */
  searchResults: SearchResult[];
  
  /** Extracted data from documents */
  extractions: Extraction[];
  
  /** Synthesis report */
  synthesis?: Synthesis;
  
  /** Current pipeline stage */
  stage: ResearchStage;
}

export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  source: string;
  timestamp: string;
  relevanceScore: number;
}

export interface Extraction {
  id: string;
  source: string;
  content: string;
  entities: Entity[];
  relations: Relation[];
  confidence: number;
}

export interface Entity {
  name: string;
  type: string;
  mentions: string[];
}

export interface Relation {
  source: string;
  target: string;
  type: string;
  evidence: string;
}

export interface Synthesis {
  summary: string;
  arguments: Argument[];
  conclusions: string[];
  citations: Citation[];
}

export interface Argument {
  claim: string;
  evidence: string[];
  counterArguments?: string[];
}

export interface Citation {
  id: string;
  source: string;
  url?: string;
  accessedAt: string;
}

export type ResearchStage = 
  | 'observe'
  | 'plan'
  | 'search'
  | 'extract'
  | 'synthesize'
  | 'validate'
  | 'report';
```

#### 2.2 ContextManager 类

```typescript
// src/context/ContextManager.ts

import {
  ModelAwareOptimizer,
  ModelProfile,
  modelProfileRegistry,
  type OptimizationHint,
} from 'claw-ctx';
import type { ResearchContext } from './ResearchContext.js';

export interface ContextManagerConfig {
  /** Model profile for optimization */
  modelProfile?: ModelProfile;
  
  /** Max tokens for context */
  maxTokens?: number;
  
  /** Enable proactive compaction */
  enableCompaction?: boolean;
}

export interface OptimizedContext {
  /** Optimized research context */
  context: ResearchContext;
  
  /** Token count after optimization */
  tokenCount: number;
  
  /** Optimization hints applied */
  hints: OptimizationHint[];
  
  /** Compaction ratio */
  compactionRatio: number;
}

/**
 * Context Manager for DeepClaw
 * Integrates with claw-ctx for model-aware optimization
 */
export class ContextManager {
  private optimizer: ModelAwareOptimizer;
  private modelProfile: ModelProfile;
  private maxTokens: number;
  
  constructor(config?: ContextManagerConfig) {
    this.modelProfile = config?.modelProfile 
      ?? modelProfileRegistry.getProfile('deepseek-v4-flash')
      ?? modelProfileRegistry.getProfile('default')!;
    
    this.maxTokens = config?.maxTokens ?? 100000;
    
    this.optimizer = new ModelAwareOptimizer({
      maxTokens: this.maxTokens,
      strategy: this.modelProfile.optimizationStrategy,
    });
  }
  
  /**
   * Optimize research context for model
   */
  async optimize(context: ResearchContext): Promise<OptimizedContext> {
    const result = await this.optimizer.optimize(
      this.toOptimizableContext(context),
      this.modelProfile
    );
    
    return {
      context: this.fromOptimizableContext(result.context),
      tokenCount: result.tokenCount,
      hints: result.hints,
      compactionRatio: result.compactionRatio,
    };
  }
  
  /**
   * Set model profile for optimization
   */
  setModelProfile(profile: ModelProfile): void {
    this.modelProfile = profile;
    this.optimizer = new ModelAwareOptimizer({
      maxTokens: this.maxTokens,
      strategy: profile.optimizationStrategy,
    });
  }
  
  /**
   * Get current model profile
   */
  getModelProfile(): ModelProfile {
    return this.modelProfile;
  }
  
  /**
   * Convert ResearchContext to claw-ctx format
   */
  private toOptimizableContext(context: ResearchContext): unknown {
    // Convert to format expected by ModelAwareOptimizer
    return {
      ...context,
      // Flatten for optimization
      _type: 'research',
      _priority: this.calculatePriority(context),
    };
  }
  
  /**
   * Convert from claw-ctx format back to ResearchContext
   */
  private fromOptimizableContext(optimized: unknown): ResearchContext {
    return optimized as ResearchContext;
  }
  
  /**
   * Calculate priority for context items
   */
  private calculatePriority(context: ResearchContext): number {
    // Higher priority for synthesis and conclusions
    if (context.synthesis) return 0.9;
    if (context.extractions.length > 0) return 0.7;
    if (context.searchResults.length > 0) return 0.5;
    return 0.3;
  }
}

export const contextManager = new ContextManager();
```

---

### 3. MetricsCollector 实现

**目录**: `src/observe/`

**文件**:
- `src/observe/ResearchMetrics.ts` — 研究指标类型
- `src/observe/MetricsCollector.ts` — 指标收集器
- `src/observe/index.ts` — 导出

#### 3.1 ResearchMetrics 类型

```typescript
// src/observe/ResearchMetrics.ts

/**
 * Research metrics for DeepClaw
 */
export interface ResearchMetrics {
  /** Search latency by source (ms) */
  searchLatency: Map<string, number[]>;
  
  /** Total search count */
  searchCount: number;
  
  /** Extraction quality by doc ID */
  extractionQuality: Map<string, number>;
  
  /** Gate results */
  gateResults: Map<string, GateResult>;
  
  /** Token usage */
  tokenUsage: TokenUsage;
  
  /** Memory usage */
  memoryUsage: MemoryUsage;
}

export interface GateResult {
  gateName: string;
  passed: number;
  failed: number;
  lastCheck: string;
}

export interface TokenUsage {
  total: number;
  byStage: Map<string, number>;
  byModel: Map<string, number>;
}

export interface MemoryUsage {
  peak: number;
  current: number;
  contextSize: number;
}

/**
 * Metrics snapshot for reporting
 */
export interface MetricsSnapshot {
  timestamp: string;
  metrics: ResearchMetrics;
  sessionId: string;
}
```

#### 3.2 MetricsCollector 类

```typescript
// src/observe/MetricsCollector.ts

import {
  EventBus,
  TokenCounter,
  type MetricsSnapshot as ObsMetricsSnapshot,
} from 'claw-obs';
import type { ResearchMetrics, MetricsSnapshot, GateResult } from './ResearchMetrics.js';

export interface MetricsCollectorConfig {
  /** Enable event bus */
  enableEvents?: boolean;
  
  /** Session ID for tracking */
  sessionId?: string;
}

/**
 * Metrics Collector for DeepClaw
 * Integrates with claw-obs for observability
 */
export class MetricsCollector {
  private eventBus: EventBus | null = null;
  private tokenCounter: TokenCounter;
  private metrics: ResearchMetrics;
  private sessionId: string;
  
  constructor(config?: MetricsCollectorConfig) {
    this.sessionId = config?.sessionId ?? `deepclaw-${Date.now()}`;
    
    if (config?.enableEvents) {
      this.eventBus = new EventBus();
    }
    
    this.tokenCounter = new TokenCounter();
    
    this.metrics = this.initMetrics();
  }
  
  /**
   * Record search latency
   */
  recordSearchLatency(source: string, latencyMs: number): void {
    const latencies = this.metrics.searchLatency.get(source) ?? [];
    latencies.push(latencyMs);
    this.metrics.searchLatency.set(source, latencies);
    this.metrics.searchCount++;
    
    this.emitEvent('search_complete', { source, latencyMs });
  }
  
  /**
   * Record extraction quality
   */
  recordExtractionQuality(docId: string, score: number): void {
    this.metrics.extractionQuality.set(docId, score);
    this.emitEvent('extraction_complete', { docId, score });
  }
  
  /**
   * Record gate result
   */
  recordGateResult(gateName: string, passed: boolean): void {
    const result = this.metrics.gateResults.get(gateName) ?? {
      gateName,
      passed: 0,
      failed: 0,
      lastCheck: new Date().toISOString(),
    };
    
    if (passed) {
      result.passed++;
    } else {
      result.failed++;
    }
    result.lastCheck = new Date().toISOString();
    
    this.metrics.gateResults.set(gateName, result);
    this.emitEvent('gate_check', { gateName, passed });
  }
  
  /**
   * Record token usage
   */
  recordTokenUsage(stage: string, count: number, model?: string): void {
    this.metrics.tokenUsage.total += count;
    
    const stageUsage = this.metrics.tokenUsage.byStage.get(stage) ?? 0;
    this.metrics.tokenUsage.byStage.set(stage, stageUsage + count);
    
    if (model) {
      const modelUsage = this.metrics.tokenUsage.byModel.get(model) ?? 0;
      this.metrics.tokenUsage.byModel.set(model, modelUsage + count);
    }
  }
  
  /**
   * Update memory usage
   */
  updateMemoryUsage(current: number, contextSize: number): void {
    this.metrics.memoryUsage.current = current;
    this.metrics.memoryUsage.contextSize = contextSize;
    
    if (current > this.metrics.memoryUsage.peak) {
      this.metrics.memoryUsage.peak = current;
    }
  }
  
  /**
   * Get current metrics
   */
  getMetrics(): ResearchMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Get metrics snapshot
   */
  getSnapshot(): MetricsSnapshot {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      sessionId: this.sessionId,
    };
  }
  
  /**
   * Flush metrics to backend (if configured)
   */
  async flush(): Promise<void> {
    if (this.eventBus) {
      await this.eventBus.publish('metrics_flush', this.getSnapshot());
    }
  }
  
  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = this.initMetrics();
  }
  
  /**
   * Initialize empty metrics
   */
  private initMetrics(): ResearchMetrics {
    return {
      searchLatency: new Map(),
      searchCount: 0,
      extractionQuality: new Map(),
      gateResults: new Map(),
      tokenUsage: {
        total: 0,
        byStage: new Map(),
        byModel: new Map(),
      },
      memoryUsage: {
        peak: 0,
        current: 0,
        contextSize: 0,
      },
    };
  }
  
  /**
   * Emit event to bus (if enabled)
   */
  private emitEvent(name: string, data: unknown): void {
    if (this.eventBus) {
      this.eventBus.publish(name, data);
    }
  }
}

export const metricsCollector = new MetricsCollector();
```

---

### 4. 导出更新

**文件**: `src/index.ts`

```typescript
// Add exports
export * from './context/index.js';
export * from './observe/index.js';
```

---

## 单元测试

| 测试文件 | 测试数 | 覆盖内容 |
|----------|:------:|----------|
| `tests/context/ContextManager.test.ts` | 12 | 上下文优化、模型感知、优先级计算 |
| `tests/observe/MetricsCollector.test.ts` | 12 | 指标收集、事件发射、快照 |

---

## 验收标准

- [ ] `npm run build` 通过
- [ ] `npm test` 通过（无回归）
- [ ] 新增测试 ≥ 24 个
- [ ] ContextManager 正确集成 claw-ctx
- [ ] MetricsCollector 正确集成 claw-obs

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
