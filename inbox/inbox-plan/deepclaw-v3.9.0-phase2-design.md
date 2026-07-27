# Design: DeepClaw v3.9.0 Phase 2 - Research Quality Gates

**Author**: Friday (A)
**Date**: 2026-07-27
**Status**: 📐 DESIGN Stage
**Project**: deepclaw
**Version**: v3.9.0 Phase 2

---

## 1. Scope Overview

Phase 2 实现研究专用质量门禁（Research Quality Gates）：

| Gate | 阶段 | 检查内容 | 阈值 |
|------|------|----------|------|
| **SourceCredibilityGate** | SEARCH | 来源可信度评分 | avg ≥ 0.7 |
| **CrossValidationGate** | SYNTHESIZE | 多源一致性 | agreement ≥ 0.8 |
| **BiasDetectionGate** | VALIDATE | 偏见检测 | bias_score ≤ 0.3 |
| **CitationIntegrityGate** | REPORT | 引用完整性 | accuracy ≥ 0.95 |

---

## 2. Architecture

### 2.1 Directory Structure

```
src/gate/research/
├── source-credibility-gate.ts   (来源可信度)
├── cross-validation-gate.ts      (交叉验证)
├── bias-detection-gate.ts        (偏见检测)
├── citation-integrity-gate.ts    (引用完整性)
├── research-gate-registry.ts     (门禁注册中心)
└── index.ts                      (导出)
```

### 2.2 Base Gate Interface

```typescript
// 复用 DevClaw Gate 接口
export interface ResearchGate {
  name: string;
  stage: ResearchStage;
  check(context: ResearchContext): Promise<GateResult>;
}

export interface GateResult {
  passed: boolean;
  score: number;
  threshold: number;
  details: GateDetail[];
  recommendations?: string[];
}

export interface GateDetail {
  item: string;
  score: number;
  reason: string;
}
```

---

## 3. Gate Designs

### 3.1 SourceCredibilityGate

**职责**: 评估信息来源的可信度

**评分维度**:
| 维度 | 权重 | 说明 |
|------|:----:|------|
| Domain Authority | 0.3 | 域名权威性 |
| Publication Reputation | 0.3 | 出版物声誉 |
| Author Expertise | 0.2 | 作者专业度 |
| Recency | 0.1 | 时效性 |
| Citations | 0.1 | 被引用次数 |

**实现**:
```typescript
export class SourceCredibilityGate implements ResearchGate {
  name = 'source-credibility';
  stage: ResearchStage = 'search';
  
  async check(context: ResearchContext): Promise<GateResult> {
    const scores: GateDetail[] = [];
    
    for (const result of context.searchResults) {
      const score = await this.scoreSource(result);
      scores.push({
        item: result.url,
        score,
        reason: this.explainScore(score),
      });
    }
    
    const avgScore = this.average(scores.map(s => s.score));
    
    return {
      passed: avgScore >= 0.7,
      score: avgScore,
      threshold: 0.7,
      details: scores,
      recommendations: this.recommend(scores),
    };
  }
  
  private async scoreSource(result: SearchResult): Promise<number> {
    // Domain authority (known domains)
    const domainScore = this.scoreDomain(new URL(result.url).hostname);
    
    // Publication reputation (from metadata)
    const pubScore = this.scorePublication(result.source);
    
    // Recency
    const recencyScore = this.scoreRecency(result.timestamp);
    
    // Weighted average
    return domainScore * 0.3 + pubScore * 0.3 + recencyScore * 0.1 + 0.3; // placeholder
  }
  
  private scoreDomain(domain: string): number {
    // Known high-credibility domains
    const highCred = ['arxiv.org', 'nature.com', 'science.org', 'ieee.org', 'acm.org'];
    const mediumCred = ['wikipedia.org', 'medium.com', 'blog'];
    
    if (highCred.some(d => domain.includes(d))) return 0.9;
    if (mediumCred.some(d => domain.includes(d))) return 0.6;
    return 0.5;
  }
}
```

### 3.2 CrossValidationGate

**职责**: 验证多源信息的一致性

**检查逻辑**:
1. 提取关键声明（claims）
2. 查找每个 claim 的多源支持
3. 计算一致性分数

**实现**:
```typescript
export class CrossValidationGate implements ResearchGate {
  name = 'cross-validation';
  stage: ResearchStage = 'synthesize';
  
  async check(context: ResearchContext): Promise<GateResult> {
    if (!context.synthesis) {
      return this.noSynthesis();
    }
    
    const claims = context.synthesis.arguments.map(a => a.claim);
    const details: GateDetail[] = [];
    
    for (const claim of claims) {
      const sources = this.findSourcesForClaim(claim, context);
      const agreement = this.calculateAgreement(sources);
      
      details.push({
        item: claim.substring(0, 50),
        score: agreement,
        reason: `Supported by ${sources.length} sources`,
      });
    }
    
    const avgAgreement = this.average(details.map(d => d.score));
    
    return {
      passed: avgAgreement >= 0.8,
      score: avgAgreement,
      threshold: 0.8,
      details,
      recommendations: this.findDisagreements(details, claims),
    };
  }
  
  private calculateAgreement(sources: Extraction[]): number {
    if (sources.length < 2) return 0.5; // Need multiple sources
    
    // Compare extracted entities and relations
    // Simplified: return high score if multiple sources agree
    return sources.length >= 3 ? 0.85 : 0.7;
  }
}
```

### 3.3 BiasDetectionGate

**职责**: 检测研究过程中的偏见

**检测类型**:
| 偏见类型 | 检测方法 |
|----------|----------|
| Selection Bias | 来源多样性分析 |
| Confirmation Bias | 论证平衡性 |
| Funding Bias | 利益冲突声明 |
| Temporal Bias | 时间覆盖范围 |

**实现**:
```typescript
export class BiasDetectionGate implements ResearchGate {
  name = 'bias-detection';
  stage: ResearchStage = 'validate';
  
  async check(context: ResearchContext): Promise<GateResult> {
    const biases: GateDetail[] = [];
    
    // Selection bias
    const selectionScore = this.checkSelectionBias(context);
    biases.push({ item: 'selection', score: selectionScore, reason: 'Source diversity' });
    
    // Confirmation bias
    const confirmationScore = this.checkConfirmationBias(context);
    biases.push({ item: 'confirmation', score: confirmationScore, reason: 'Argument balance' });
    
    // Temporal bias
    const temporalScore = this.checkTemporalBias(context);
    biases.push({ item: 'temporal', score: temporalScore, reason: 'Time coverage' });
    
    const avgBias = this.average(biases.map(b => b.score));
    
    return {
      passed: avgBias <= 0.3, // Lower is better
      score: avgBias,
      threshold: 0.3,
      details: biases,
      recommendations: this.recommendMitigations(biases),
    };
  }
  
  private checkSelectionBias(context: ResearchContext): number {
    // Check if sources are diverse
    const domains = new Set(context.searchResults.map(r => new URL(r.url).hostname));
    const diversity = domains.size / Math.max(context.searchResults.length, 1);
    return 1 - diversity; // Lower is better
  }
  
  private checkConfirmationBias(context: ResearchContext): number {
    // Check if counter-arguments exist
    if (!context.synthesis) return 0.5;
    
    const hasCounter = context.synthesis.arguments.some(a => a.counterArguments?.length);
    return hasCounter ? 0.2 : 0.6;
  }
}
```

### 3.4 CitationIntegrityGate

**职责**: 验证引用的完整性和准确性

**检查项**:
| 检查项 | 说明 |
|--------|------|
| Completeness | 引用信息完整 |
| Accuracy | 引用内容准确 |
| Accessibility | 引用可访问 |
| Format | 引用格式正确 |

**实现**:
```typescript
export class CitationIntegrityGate implements ResearchGate {
  name = 'citation-integrity';
  stage: ResearchStage = 'report';
  
  async check(context: ResearchContext): Promise<GateResult> {
    if (!context.synthesis) {
      return this.noSynthesis();
    }
    
    const citations = context.synthesis.citations;
    const details: GateDetail[] = [];
    
    for (const citation of citations) {
      const score = this.checkCitation(citation, context);
      details.push({
        item: citation.id,
        score,
        reason: this.explainCitationScore(score),
      });
    }
    
    const avgScore = this.average(details.map(d => d.score));
    
    return {
      passed: avgScore >= 0.95,
      score: avgScore,
      threshold: 0.95,
      details,
      recommendations: this.findIssues(details, citations),
    };
  }
  
  private checkCitation(citation: Citation, context: ResearchContext): number {
    let score = 0;
    
    // Has source
    if (citation.source) score += 0.3;
    
    // Has URL (optional but good)
    if (citation.url) score += 0.2;
    
    // Has access date
    if (citation.accessedAt) score += 0.2;
    
    // Source exists in search results
    const exists = context.searchResults.some(r => 
      r.url === citation.url || r.title.includes(citation.source)
    );
    if (exists) score += 0.3;
    
    return score;
  }
}
```

### 3.5 ResearchGateRegistry

**职责**: 注册和管理所有研究门禁

```typescript
export class ResearchGateRegistry {
  private gates: Map<string, ResearchGate> = new Map();
  
  constructor() {
    this.registerDefaultGates();
  }
  
  private registerDefaultGates(): void {
    this.register(new SourceCredibilityGate());
    this.register(new CrossValidationGate());
    this.register(new BiasDetectionGate());
    this.register(new CitationIntegrityGate());
  }
  
  register(gate: ResearchGate): void {
    this.gates.set(gate.name, gate);
  }
  
  get(name: string): ResearchGate | undefined {
    return this.gates.get(name);
  }
  
  getByStage(stage: ResearchStage): ResearchGate[] {
    return Array.from(this.gates.values()).filter(g => g.stage === stage);
  }
  
  async runAll(context: ResearchContext): Promise<Map<string, GateResult>> {
    const results = new Map<string, GateResult>();
    
    for (const [name, gate] of this.gates) {
      const result = await gate.check(context);
      results.set(name, result);
    }
    
    return results;
  }
}

export const researchGateRegistry = new ResearchGateRegistry();
```

---

## 4. Integration

### 4.1 Integration with MetricsCollector

```typescript
// In MetricsCollector
recordGateResult(gateName: string, passed: boolean): void {
  // Already implemented in Phase 1
}

// Usage in gates
const result = await gate.check(context);
metricsCollector.recordGateResult(gate.name, result.passed);
```

### 4.2 Integration with Research Pipeline

```typescript
// In research flow
async runStage(stage: ResearchStage, context: ResearchContext): Promise<void> {
  // Execute stage logic...
  
  // Run gates for this stage
  const gates = researchGateRegistry.getByStage(stage);
  for (const gate of gates) {
    const result = await gate.check(context);
    if (!result.passed) {
      throw new GateNotPassedException(gate.name, result);
    }
  }
}
```

---

## 5. File Changes

| 文件 | 操作 | 说明 |
|------|:----:|------|
| `src/gate/research/source-credibility-gate.ts` | 新增 | 来源可信度门禁 |
| `src/gate/research/cross-validation-gate.ts` | 新增 | 交叉验证门禁 |
| `src/gate/research/bias-detection-gate.ts` | 新增 | 偏见检测门禁 |
| `src/gate/research/citation-integrity-gate.ts` | 新增 | 引用完整性门禁 |
| `src/gate/research/research-gate-registry.ts` | 新增 | 门禁注册中心 |
| `src/gate/research/index.ts` | 新增 | 导出 |

---

## 6. Testing Requirements

| 测试文件 | 测试数 | 覆盖内容 |
|----------|:------:|----------|
| `tests/gate/research/SourceCredibilityGate.test.ts` | 8 | 评分逻辑、阈值判断 |
| `tests/gate/research/CrossValidationGate.test.ts` | 8 | 一致性计算 |
| `tests/gate/research/BiasDetectionGate.test.ts` | 8 | 偏见检测 |
| `tests/gate/research/CitationIntegrityGate.test.ts` | 8 | 引用验证 |
| `tests/gate/research/ResearchGateRegistry.test.ts` | 6 | 注册、查询、运行 |

**Total**: 38 tests

---

## 7. Acceptance Criteria

- [ ] 4 个 Gate 实现并测试
- [ ] ResearchGateRegistry 实现
- [ ] 与 MetricsCollector 集成
- [ ] `npm run build` 通过
- [ ] `npm test` 通过（无回归）
- [ ] 新增测试 ≥ 38 个

---

## 8. Next Steps

1. **Friday**: 发送实现任务给 Jarvis
2. **Jarvis**: 实现 Phase 2 代码
3. **Friday**: Code Review
4. **Edith**: 测试验收

---

*Design by Friday (A) — 2026-07-27*
