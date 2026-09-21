# Ack: Release 标题改小写 + v4.0.0 并入 v4.0.0-ga

**Status**: **complete** —— 36/36 标题 = `sciclaw <tag>`；`v4.0.0` Release 已并入 `v4.0.0-ga` 并删除；两个 git tag 均保留
**From**: Karen (ReleaseAgent) ｜ **To**: Friday (ArchitectAgent) / Peter (Owner)
**Date**: 2026-09-21 ｜ **Task**: `inbox/inbox-release/task-release-lowercase-merge-v400.md`（Peter 23:09 两项更正）
**对象**: `opensourceclaw/sciclaw`（public）｜ **改前快照** `/tmp/rel-before2.json`、**改后** `/tmp/rel-after2.json`（同端点同序比对）

---

## 1. 标题小写化（36/36）

`SciClaw <tag>` → `sciclaw <tag>`，逐条 `gh release edit <tag> -R opensourceclaw/sciclaw --title "sciclaw <tag>"`；**title-only，正文零改动**。
`gh api repos/.../releases` 断言：`title mismatches: []`、`titles not starting with sciclaw: []`、`body changed on non-merged releases: []`。

## 2. v4.0.0 → v4.0.0-ga 合并

- **保留** `v4.0.0-ga`（Latest、non-prerelease），新标题 `sciclaw v4.0.0-ga`。
- **合并体**：7084 字节，md5 `2ac89917`。结构（v4.0.0-ga 正文在前，分隔线接历史小节）：

  ```
  <v4.0.0-ga 原文（4274B, 改前 md5 6a055103）>

  ---

  ## v4.0.0 — identity integration milestone（历史版本）

  <v4.0.0 原文（2754B, 改前 md5 07e91537）>
  ```

- 两段原文**逐字保留**：`includes()` 双段断言均 True（未润色、未改写、未去尾注）。构建方式 = 原字节拼接，非重排重写。
- **删除** `v4.0.0` Release：`gh release delete v4.0.0 --yes`（**未**加 `--cleanup-tag`）；断言 `v4.0.0 release still present: false`。
- 执行顺序：① ga 标题+合并正文 → ② 其余 35 条标题小写 → ③ 删除 v4.0.0 Release。

## 3. 核对输出

```
=== 全量核对（37 → 36） ===
before: 37 | after: 36
title mismatches: []
body changed on non-merged releases: []
v4.0.0 release still present: false
titles not starting with sciclaw: []
ga title: sciclaw v4.0.0-ga | md5 2ac89917 len 7084 | == merged file: true
ga includes original ga body verbatim: true
ga includes original v4.0.0 body verbatim: true
ga prerelease flag: false | tag: v4.0.0-ga

=== 改后 36 条标题（均前缀 `sciclaw `，逐条由 releases API 断言）===
v4.0.0-ga / v3.9.0 / v3.8.0 / v3.7.0 / v3.5.0 / v3.4.0 / v3.3.0 / v3.2.0 / v3.1.0 / v3.0.3 / v3.0.2 / v3.0.1 /
v3.0.0-rc.3 / v3.0.0-rc.2 / v3.0.0-rc.1 / v3.0.0-beta.3 / v3.0.0 / v3.0.0-beta.2 / v3.0.0-beta.1 /
v2.0.0-rc.3 / v2.0.0-rc.2 / v2.0.0 / v2.0.0-rc.1 / v2.0.0-beta.4 / v2.0.0-beta.3 / v2.0.0-beta.2 / v2.0.0-beta.1 /
v1.0.0 / v0.8.0 / v0.7.0 / v0.6.0 / v0.5.0 / v0.4.0 / v0.3.0 / v0.2.0 / v0.1.0

=== git tag 保留确认（git ls-remote --tags origin 'refs/tags/v4.0.0*'）===
1abab6c802ba9a60f83c9295a3ab36dbce31930b  refs/tags/v4.0.0
dbf263c21f8866d789eb5722c771b9212c4e58bf  refs/tags/v4.0.0^{}
7f495f3f0c45c26c4e25695402a0aaaedcf81d3b  refs/tags/v4.0.0-ga
d86665928fc2d59a838bda1fa570c5bc08b3d537  refs/tags/v4.0.0-ga^{}
→ 两个 tag 均在；`v4.0.0^{}` 仍指向 dbf263c、`v4.0.0-ga^{}` 仍指向 d866659（与发布时一致）

=== tag ↔ Release 全量对账 ===
remote tags: 37 | releases: 36
tags without Release: ["v4.0.0"]
releases without tag: []
```

## 4. 主动追加一处修复（可一键回退，请审）

`.github/workflows/release.yml` 第二道检查是「Release body == 仓内 notes」。合并正文后若不同步 notes，不变式即**静默失效**（正是该守卫要防的 rot）。故同步 `docs/roadmaps/releases/v4.0.0-ga/v4.0.0-ga.md` 为合并体：

- 实测 `notes file md5 == Release body md5 == 2ac89917`（逐字节相等）
- 原文件内容在 git 历史中可查；不认可可 `git revert` 该 commit

守卫仅 `on: push: tags: ['v*']` 触发，本次 Release 编辑/删除**不会**触发 CI。

## 5. 自我更正 + 观察

1. **更正上一份回执的观察 2**（`ack-release-titles-unify-20260921.md`）：其中称 `v3.6.0`、`v3.0.0-rc.4`「有 tag 无 Release」——**该判断错误**。本次全量对账实测：远端 tag 共 37 个，其中**只有 `v4.0.0` 无 Release**（本地亦不存在 v3.6.0 / v3.0.0-rc.4 tag）。上份回执该条作废。
2. `v4.0.0` 现在**有 tag 无 Release**（本次合并的必然结果）。若该 tag 日后被重新 push，守卫会 fail-closed 报 missing Release。要否处理（补最小 Release / 例外白名单）请你定。
3. 本任务未触碰任何 git tag；`v4.0.0` 的仓内 notes 文件 `docs/roadmaps/releases/v4.0.0/v4.0.0.md` 保留未动（历史留档）。

— Karen (ReleaseAgent), 2026-09-21
