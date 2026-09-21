# Ack: Release 标题统一为 `SciClaw <tag>`

**Status**: **complete** —— **37/37** 标题归一到 `SciClaw <tag>`，**body（正文）逐条零改动**
**From**: Karen (ReleaseAgent) ｜ **To**: Friday (ArchitectAgent) / Peter (Owner)
**Date**: 2026-09-21 ｜ **Task**: `inbox/inbox-release/task-release-titles-unify.md`（Peter 22:03 指令）
**对象**: `opensourceclaw/sciclaw`（已 public）

---

## 一处与任务书不符（如实上报）

任务书写「全部 **30** 个 release」，**实际为 37 个**（`gh api repos/.../releases?per_page=100 --paginate`）。按任务意图「全部 release 标题统一」，**37 个全部处理**，未漏改。

## 执行方式

```
gh release edit <tag> -R opensourceclaw/sciclaw --title "SciClaw <tag>"
```

- title-only：`--title` 不改 body；下方核对以 **body md5 改前/改后比对**为证。
- 改前快照 `/tmp/rel-before.json`、改后快照 `/tmp/rel-after.json` 均在案（同一 API 端点，同序比对）。

## 全量核对输出（37/37）

格式：`OK <body 状态> <tag> | 改前标题 => 改后标题`

```
OK  body-same  v4.0.0-ga      | SciClaw v4.0.0-ga — production-ready, verified => SciClaw v4.0.0-ga
OK  body-same  v4.0.0         | SciClaw v4.0.0 — identity integration milestone => SciClaw v4.0.0
OK  body-same  v3.9.0         | DeepClaw v3.9.0 - Research Methodology Enhancement => SciClaw v3.9.0
OK  body-same  v3.8.0         | DeepClaw v3.8.0 — Flow Separation => SciClaw v3.8.0
OK  body-same  v3.7.0         | v3.7.0: Monorepo Separation => SciClaw v3.7.0
OK  body-same  v3.5.0         | deepclaw v3.5.0 => SciClaw v3.5.0
OK  body-same  v3.4.0         | DeepClaw v3.4.0 => SciClaw v3.4.0
OK  body-same  v3.3.0         | DeepClaw v3.3.0 => SciClaw v3.3.0
OK  body-same  v3.2.0         | DeepClaw v3.2.0 => SciClaw v3.2.0
OK  body-same  v3.1.0         | DeepClaw v3.1.0 => SciClaw v3.1.0
OK  body-same  v3.0.3         | DeepClaw v3.0.3 => SciClaw v3.0.3
OK  body-same  v3.0.2         | DeepClaw v3.0.2 => SciClaw v3.0.2
OK  body-same  v3.0.1         | deepclaw v3.0.1 => SciClaw v3.0.1
OK  body-same  v3.0.0-rc.3    | deepclaw v3.0.0-rc.3 => SciClaw v3.0.0-rc.3
OK  body-same  v3.0.0-rc.2    | DeepClaw v3.0.0-rc.2 => SciClaw v3.0.0-rc.2
OK  body-same  v3.0.0-rc.1    | DeepClaw v3.0.0-rc.1 => SciClaw v3.0.0-rc.1
OK  body-same  v3.0.0-beta.3  | DeepClaw v3.0.0-beta.3 => SciClaw v3.0.0-beta.3
OK  body-same  v3.0.0         | DeepClaw v3.0.0 - Stable Release => SciClaw v3.0.0
OK  body-same  v3.0.0-beta.2  | DeepClaw v3.0.0-beta.2 => SciClaw v3.0.0-beta.2
OK  body-same  v3.0.0-beta.1  | DeepClaw v3.0.0-beta.1 => SciClaw v3.0.0-beta.1
OK  body-same  v2.0.0-rc.3    | deepclaw v2.0.0-rc.3 => SciClaw v2.0.0-rc.3
OK  body-same  v2.0.0-rc.2    | deepclaw v2.0.0-rc.2 => SciClaw v2.0.0-rc.2
OK  body-same  v2.0.0         | DeepClaw v2.0.0 - TypeScript Migration Complete => SciClaw v2.0.0
OK  body-same  v2.0.0-rc.1    | DeepClaw v2.0.0-rc.1 => SciClaw v2.0.0-rc.1
OK  body-same  v2.0.0-beta.4  | DeepClaw v2.0.0-beta.4 => SciClaw v2.0.0-beta.4
OK  body-same  v2.0.0-beta.3  | DeepClaw v2.0.0-beta.3 => SciClaw v2.0.0-beta.3
OK  body-same  v2.0.0-beta.2  | DeepClaw v2.0.0-beta.2 => SciClaw v2.0.0-beta.2
OK  body-same  v2.0.0-beta.1  | DeepClaw v2.0.0-beta.1 => SciClaw v2.0.0-beta.1
OK  body-same  v1.0.0         | DeepClaw v1.0.0 - Evolution => SciClaw v1.0.0
OK  body-same  v0.8.0         | DeepClaw v0.8.0 - Truth Seeker => SciClaw v0.8.0
OK  body-same  v0.7.0         | DeepClaw v0.7.0 - Trust First => SciClaw v0.7.0
OK  body-same  v0.6.0         | DeepClaw v0.6.0 => SciClaw v0.6.0
OK  body-same  v0.5.0         | ResearchClaw v0.5.0 => SciClaw v0.5.0
OK  body-same  v0.4.0         | ResearchClaw v0.4.0 => SciClaw v0.4.0
OK  body-same  v0.3.0         | ResearchClaw v0.3.0 => SciClaw v0.3.0
OK  body-same  v0.2.0         | ResearchClaw v0.2.0 => SciClaw v0.2.0
OK  body-same  v0.1.0         | ResearchClaw v0.1.0 => SciClaw v0.1.0
---
total releases: 37
title == SciClaw <tag> AND body hash unchanged: 37/37
failures: []
bodies changed: []
```

## 观察（供 Friday 参考，非本任务范围）

1. 历史品牌面共 **4 种**前缀：`ResearchClaw`（v0.1–v0.5）→ `DeepClaw` / `deepclaw`（大小写混用，v0.6–v3.9）→ `SciClaw`（v4.x）。本次归一后，Release 列表的品牌面**首次内部一致**。
2. v3.6.0、v3.0.0-rc.4 等**无 Release 记录**（tag 存在与否未在本次范围核对）；若需「tag ↔ Release」全量对齐，可另开任务。
3. 本任务**未触碰 git tag 本身**（仅 Release 标题），tag 与 body 均保持原状。

— Karen (ReleaseAgent), 2026-09-21
