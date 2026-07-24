# P0 Decision: DeepClaw/AutoClaw Architecture Separation

**Date**: 2026-07-24
**Status**: ✅ Decision Made — Awaiting Implementation
**Approved by**: Peter

---

## 1. Decision Summary

| Decision | Choice |
|----------|--------|
| **Architecture** | Separate systems with Shared Core |
| **Package structure** | Monorepo: `deepclaw-core` + `deepclaw` + `autoclaw` |
| **Process/Architecture** | Each project uses its own research pipeline, NOT DevClaw 9 Stage |
| **Sharing scope** | Basic technical components only |

## 2. Monorepo Layout

```
workspace/osprojects/
├── deepclaw-core/           # 共享核心 (npm package)
│   ├── package.json         # name: @deepclaw/core
│   └── src/
│       ├── search/          # 搜索引擎
│       ├── extractor/       # 内容提取
│       ├── llm/             # LLM 调用
│       ├── model/           # 模型路由
│       ├── cache/           # 缓存
│       ├── tools/           # 通用工具
│       └── types/           # 共享类型
│
├── deepclaw/                # Deep Research 应用
│   ├── package.json         # depends: @deepclaw/core
│   └── src/
│       ├── research/        # 深度研究引擎
│       ├── agents/          # 研究 Agent (Researcher/Analyzer/Writer)
│       ├── interactive/     # 人机交互
│       ├── knowledge/       # 知识管理
│       └── hypothesis/      # 假设验证
│
└── autoclaw/                # Auto Research 应用
    ├── package.json         # depends: @deepclaw/core
    └── src/
        ├── orchestrator/    # 自动研究编排
        ├── trigger/         # 自动触发
        ├── agents/          # Auto Agent
        └── experiment/      # 批量实验
```

## 3. Sharing Principle

```
deepclaw-core (共享基础组件)

  技术基础设施:          应用层 (各自独立):
  ┌──────────────┐      ┌──────────────────────┐
  │ search       │      │ deepclaw (Deep Research)
  │ extractor    │      │  - Research Pipeline
  │ llm/model    │      │  - Quality Gates (Human)
  │ cache        │      │  - Interactive Flow
  │ tools/types  │      ├──────────────────────┤
  └──────────────┘      │ autoclaw (Auto Research)
         │               │  - Auto Pipeline
    ─────┼────────       │  - Quality Gates (Algorithm)
         │               │  - Batch Processing
    shared               └──────────────────────┘
                         independent
```

## 4. Implementation Plan

### Sprint 1: Extract Core
- [ ] Create `deepclaw-core/` package
- [ ] Migrate shared modules from deepclaw → core
- [ ] Update tests

### Sprint 2: Separate deepclaw
- [ ] Remove migrated modules from deepclaw
- [ ] Add `@deepclaw/core` dependency
- [ ] Verify all tests pass

### Sprint 3: Separate autoclaw
- [ ] Remove migrated modules from autoclaw
- [ ] Add `@deepclaw/core` dependency
- [ ] Verify all tests pass

---

*Friday (A) — 2026-07-24*
