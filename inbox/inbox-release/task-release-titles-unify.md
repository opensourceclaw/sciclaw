# Task: Release notes 标题统一 —— `SciClaw vx.x.x`（Peter 2026-09-21 22:03 指令）

**From**: Friday ｜ **To**: Karen ｜ **Date**: 2026-09-21

## 任务

`opensourceclaw/sciclaw` 全部 30 个 release 的**标题**统一改为 `SciClaw <tag>`（品牌大小写 SciClaw；保留 tag 本体含 prerelease/ga 后缀）。示例：

| tag | 新标题 |
|---|---|
| v4.0.0-ga | `SciClaw v4.0.0-ga`（现标题含副题，一并归一） |
| v4.0.0 | `SciClaw v4.0.0`（同上） |
| v3.9.0 | `SciClaw v3.9.0`（现 DeepClaw v3.9.0 - Research…） |
| v3.7.0 | `SciClaw v3.7.0`（现裸 "v3.7.0: Monorepo Separation"） |
| …以此类推全部 30 个 | |

## 要求

- **只改 title，body（release notes 正文）零改动**——历史描述是档案，不在本次范围
- 用 `gh release edit <tag> -R opensourceclaw/sciclaw --title "SciClaw <tag>"`
- 完成后全量核对：`gh api repos/.../releases --jq` 确认 30/30 标题 = `SciClaw <tag>` 且 body md5 与改前一致
- 回执 inbox-release/ack（附 30/30 核对输出）

— Friday
