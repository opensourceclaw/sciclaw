# Task: DeepClaw v3.9.0 Phase 2 - Research Quality Gates

**From**: Friday (A)
**To**: Jarvis (Builder)
**Date**: 2026-07-27
**Priority**: P1
**Version**: v3.9.0 Phase 2
**PipelineId**: deepclaw-v3.9.0-phase2

---

## 背景

Phase 2 实现研究专用质量门禁（Research Quality Gates）。Phase 1 已完成基础设施集成。

---

## 开发范围

### 1. 目录结构

```
src/gate/research/
├── source-credibility-gate.ts
├── cross-validation-gate.ts
├── bias-detection-gate.ts
├── citation-integrity-gate.ts
├── research-gate-registry.ts
└── index.ts
```

---

### 2. Base Types

**文件**: `src/gate/research/types.ts`

```typescript
import type { ResearchStage } from '../../context/ResearchContext.js';

export interface ResearchGate {
  readonly name: string;
  readonly stage: ResearchStage;
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

export class GateNotPassedException extends Error {
  constructor(
    public readonly gateName: string,
    public readonly result: GateResult
  ) {
    super(`Gate ${gateName} not passed: score ${result.score} < threshold ${result.threshold}`);
  }
}
```

---

### 3. SourceCredibilityGate

**文件**: `src/gate/research/source-credibility-gate.ts`

**职责**: 评估信息来源的可信度

**阈值**: avg ≥ 0.7

**评分维度**:
- Domain Authority (0.3): 域名权威性
- Publication Reputation (0.3): 出版物声誉
- Recency (0.2): 时效性
- Relevance Score (0.2): 相关性评分

**实现要点**:
```typescript
export class SourceCredibilityGate implements ResearchGate {
  readonly name = 'source-credibility';
  readonly stage: ResearchStage = 'search';
  
  async check(context: ResearchContext): Promise<GateResult> {
    const details: GateDetail[] = [];
    
    for (const result of context.searchResults) {
      const score = this.scoreSource(result);
      details.push({ item: result.url, score, reason: this.explainScore(score) });
    }
    
    const avgScore = details.length > 0 
      ? details.reduce((sum, d) => sum + d.score, 0) / details.length
      : 0;
    
    return {
      passed: avgScore >= 0.7,
      score: avgScore,
      threshold: 0.7,
      details,
      recommendations: this.recommend(details),
    };
  }
  
  private scoreSource(result: SearchResult): number {
    const domain = this.extractDomain(result.url);
    const domainScore = this.scoreDomain(domain);
    const recencyScore = this.scoreRecency(result.timestamp);
    const relevanceScore = Math.min(1, result.relevanceScore);
    
    return domainScore * 0.3 + recencyScore * 0.2 + relevanceScore * 0.2 + 0.3; // pub score placeholder
  }
  
  private scoreDomain(domain: string): number {
    const highCred = ['arxiv.org', 'nature.com', 'science.org', 'ieee.org', 'acm.org', 'springer.com', 'wiley.com'];
    const mediumCred = ['wikipedia.org', '.edu', '.gov', 'medium.com'];
    
    if (highCred.some(d => domain.includes(d))) return 0.95;
    if (mediumCred.some(d => domain.includes(d))) return 0.75;
    if (domain.includes('blog') || domain.includes('forum')) return 0.4;
    return 0.6;
  }
  
  private scoreRecency(timestamp: string): number {
    const age = Date.now() - new Date(timestamp).getTime();
    const days = age / (1000 * 60 * 60 * 24);
    
    if (days < 30) return 1.0;
    if (days < 365) return 0.8;
    if (days < 1825) return 0.6;
    return 0.4;
  }
  
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }
  
  private explainScore(score: number): string {
    if (score >= 0.9) return 'High credibility';
    if (score >= 0.7) return 'Good credibility';
    if (score >= 0.5) return 'Moderate credibility';
    return 'Low credibility';
  }
  
  private recommend(details: GateDetail[]): string[] {
    const lowScore = details.filter(d => d.score < 0.5);
    if (lowScore.length > 0) {
      return [`Consider replacing ${lowScore.length} low-credibility sources`];
    }
    return [];
  }
}
```

---

### 4. CrossValidationGate

**文件**: `src/gate/research/cross-validation-gate.ts`

**职责**: 验证多源信息的一致性

**阈值**: agreement ≥ 0.8

**实现要点**:
```typescript
export class CrossValidationGate implements ResearchGate {
  readonly name = 'cross-validation';
  readonly stage: ResearchStage = 'synthesize';
  
  async check(context: ResearchContext): Promise<GateResult> {
    if (!context.synthesis) {
      return {
        passed: false,
        score: 0,
        threshold: 0.8,
        details: [{ item: 'synthesis', score: 0, reason: 'No synthesis available' }],
      };
    }
    
    const details: GateDetail[] = [];
    const claims = context.synthesis.arguments.map(a => a.claim);
    
    for (const claim of claims) {
      const supportingSources = this.findSupportingSources(claim, context);
      const score = supportingSources.length >= 3 ? 0.9 
                  : supportingSources.length >= 2 ? 0.8 
                  : supportingSources.length >= 1 ? 0.5 
                  : 0.2;
      
      details.push({
        item: claim.substring(0, 50) + '...',
        score,
        reason: `Supported by ${supportingSources.length} sources`,
      });
    }
    
    const avgScore = details.length > 0
      ? details.reduce((sum, d) => sum + d.score, 0) / details.length
      : 0;
    
    return {
      passed: avgScore >= 0.8,
      score: avgScore,
      threshold: 0.8,
      details,
      recommendations: this.recommend(details, claims),
    };
  }
  
  private findSupportingSources(claim: string, context: ResearchContext): SearchResult[] {
    const claimWords = claim.toLowerCase().split(/\s+/);
    
    return context.searchResults.filter(result => {
      const text = (result.title + ' ' + result.snippet).toLowerCase();
      const matchCount = claimWords.filter(w => w.length > 3 && text.includes(w)).length;
      return matchCount >= 2;
    });
  }
  
  private recommend(details: GateDetail[], claims: string[]): string[] {
    const weakClaims = details.filter(d => d.score < 0.6);
    if (weakClaims.length > 0) {
      return [`Strengthen evidence for ${weakClaims.length} claims`];
    }
    return [];
  }
}
```

---

### 5. BiasDetectionGate

**文件**: `src/gate/research/bias-detection-gate.ts`

**职责**: 检测研究过程中的偏见

**阈值**: bias_score ≤ 0.3 (lower is better)

**检测类型**:
- Selection Bias: 来源多样性
- Confirmation Bias: 论证平衡性
- Temporal Bias: 时间覆盖

**实现要点**:
```typescript
export class BiasDetectionGate implements ResearchGate {
  readonly name = 'bias-detection';
  readonly stage: ResearchStage = 'validate';
  
  async check(context: ResearchContext): Promise<GateResult> {
    const details: GateDetail[] = [];
    
    // Selection bias (lower score = less bias)
    const selectionBias = this.checkSelectionBias(context);
    details.push({ item: 'selection', score: selectionBias, reason: 'Source diversity' });
    
    // Confirmation bias
    const confirmationBias = this.checkConfirmationBias(context);
    details.push({ item: 'confirmation', score: confirmationBias, reason: 'Argument balance' });
    
    // Temporal bias
    const temporalBias = this.checkTemporalBias(context);
    details.push({ item: 'temporal', score: temporalBias, reason: 'Time coverage' });
    
    const avgBias = details.reduce((sum, d) => sum + d.score, 0) / details.length;
    
    return {
      passed: avgBias <= 0.3,
      score: avgBias,
      threshold: 0.3,
      details,
      recommendations: this.recommendMitigations(details),
    };
  }
  
  private checkSelectionBias(context: ResearchContext): number {
    const domains = new Set(context.searchResults.map(r => this.extractDomain(r.url)));
    const diversity = domains.size / Math.max(context.searchResults.length, 1);
    return Math.max(0, 1 - diversity); // Lower is better
  }
  
  private checkConfirmationBias(context: ResearchContext): number {
    if (!context.synthesis) return 0.5;
    
    const hasCounter = context.synthesis.arguments.some(a => 
      a.counterArguments && a.counterArguments.length > 0
    );
    return hasCounter ? 0.15 : 0.5;
  }
  
  private checkTemporalBias(context: ResearchContext): number {
    const timestamps = context.searchResults
      .map(r => new Date(r.timestamp).getTime())
      .filter(t => !isNaN(t));
    
    if (timestamps.length < 2) return 0.5;
    
    const range = Math.max(...timestamps) - Math.min(...timestamps);
    const years = range / (1000 * 60 * 60 * 24 * 365);
    
    return years > 5 ? 0.2 : years > 2 ? 0.3 : 0.5;
  }
  
  private extractDomain(url: string): string {
    try { return new URL(url).hostname; } catch { return url; }
  }
  
  private recommendMitigations(details: GateDetail[]): string[] {
    const recs: string[] = [];
    
    const selection = details.find(d => d.item === 'selection');
    if (selection && selection.score > 0.3) {
      recs.push('Diversify information sources');
    }
    
    const confirmation = details.find(d => d.item === 'confirmation');
    if (confirmation && confirmation.score > 0.3) {
      recs.push('Add counter-arguments to strengthen analysis');
    }
    
    return recs;
  }
}
```

---

### 6. CitationIntegrityGate

**文件**: `src/gate/research/citation-integrity-gate.ts`

**职责**: 验证引用的完整性和准确性

**阈值**: accuracy ≥ 0.95

**实现要点**:
```typescript
export class CitationIntegrityGate implements ResearchGate {
  readonly name = 'citation-integrity';
  readonly stage: ResearchStage = 'report';
  
  async check(context: ResearchContext): Promise<GateResult> {
    if (!context.synthesis) {
      return {
        passed: false,
        score: 0,
        threshold: 0.95,
        details: [{ item: 'synthesis', score: 0, reason: 'No synthesis available' }],
      };
    }
    
    const citations = context.synthesis.citations;
    if (citations.length === 0) {
      return {
        passed: false,
        score: 0,
        threshold: 0.95,
        details: [{ item: 'citations', score: 0, reason: 'No citations found' }],
      };
    }
    
    const details: GateDetail[] = [];
    
    for (const citation of citations) {
      const score = this.checkCitation(citation, context);
      details.push({ item: citation.id, score, reason: this.explainCitationScore(score) });
    }
    
    const avgScore = details.reduce((sum, d) => sum + d.score, 0) / details.length;
    
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
    
    if (citation.source) score += 0.25;
    if (citation.id) score += 0.25;
    if (citation.accessedAt) score += 0.25;
    if (citation.url) score += 0.15;
    
    // Verify source exists in search results
    const exists = context.searchResults.some(r => 
      r.url === citation.url || r.title.includes(citation.source)
    );
    if (exists) score += 0.1;
    
    return Math.min(1, score);
  }
  
  private explainCitationScore(score: number): string {
    if (score >= 0.95) return 'Complete citation';
    if (score >= 0.75) return 'Good citation';
    if (score >= 0.5) return 'Incomplete citation';
    return 'Poor citation';
  }
  
  private findIssues(details: GateDetail[], citations: Citation[]): string[] {
    const issues = details.filter(d => d.score < 0.75);
    if (issues.length > 0) {
      return [`Fix ${issues.length} incomplete citations`];
    }
    return [];
  }
}
```

---

### 7. ResearchGateRegistry

**文件**: `src/gate/research/research-gate-registry.ts`

```typescript
import type { ResearchGate, GateResult } from './types.js';
import type { ResearchContext, ResearchStage } from '../../context/ResearchContext.js';
import { SourceCredibilityGate } from './source-credibility-gate.js';
import { CrossValidationGate } from './cross-validation-gate.js';
import { BiasDetectionGate } from './bias-detection-gate.js';
import { CitationIntegrityGate } from './citation-integrity-gate.js';

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
  
  getAll(): ResearchGate[] {
    return Array.from(this.gates.values());
  }
  
  async runAll(context: ResearchContext): Promise<Map<string, GateResult>> {
    const results = new Map<string, GateResult>();
    
    for (const [name, gate] of this.gates) {
      const result = await gate.check(context);
      results.set(name, result);
    }
    
    return results;
  }
  
  async runForStage(stage: ResearchStage, context: ResearchContext): Promise<Map<string, GateResult>> {
    const results = new Map<string, GateResult>();
    const gates = this.getByStage(stage);
    
    for (const gate of gates) {
      const result = await gate.check(context);
      results.set(gate.name, result);
    }
    
    return results;
  }
}

export const researchGateRegistry = new ResearchGateRegistry();
```

---

### 8. 导出

**文件**: `src/gate/research/index.ts`

```typescript
export * from './types.js';
export * from './source-credibility-gate.js';
export * from './cross-validation-gate.js';
export * from './bias-detection-gate.js';
export * from './citation-integrity-gate.js';
export * from './research-gate-registry.js';
```

---

## 单元测试

| 测试文件 | 测试数 | 覆盖内容 |
|----------|:------:|----------|
| `tests/gate/research/SourceCredibilityGate.test.ts` | 8 | 域名评分、时效性、阈值 |
| `tests/gate/research/CrossValidationGate.test.ts` | 8 | 多源支持、一致性 |
| `tests/gate/research/BiasDetectionGate.test.ts` | 8 | 选择偏见、确认偏见 |
| `tests/gate/research/CitationIntegrityGate.test.ts` | 8 | 引用完整性 |
| `tests/gate/research/ResearchGateRegistry.test.ts` | 6 | 注册、查询、运行 |

**Total**: 38 tests

---

## 验收标准

- [ ] 4 个 Gate 实现并测试
- [ ] ResearchGateRegistry 实现
- [ ] `npm run build` 通过
- [ ] `npm test` 通过（无回归）
- [ ] 新增测试 ≥ 38 个
- [ ] 全部测试通过

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
