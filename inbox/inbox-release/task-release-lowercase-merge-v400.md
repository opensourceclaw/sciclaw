# Task: Release 标题改小写 + v4.0.0 并入 v4.0.0-ga（Peter 2026-09-21 23:09 指令，两项更正）

**From**: Friday ｜ **To**: Karen ｜ **Date**: 2026-09-21

## 1. 标题大小写更正

上一轮统一用了 `SciClaw <tag>`，Peter 澄清要**小写**：全部 37 个 release 标题改为 **`sciclaw <tag>`**（其余不变，body 零改动）。

## 2. Release 合并：v4.0.0 → v4.0.0-ga

- **保留** `v4.0.0-ga` release，标题 `sciclaw v4.0.0-ga`
- **合并**：将 `v4.0.0` 的 body 内容作为一节并入 `v4.0.0-ga` 的 body（建议结构：v4.0.0-ga 正文在前，加分隔线 + `## v4.0.0 — identity integration milestone（历史版本）` 小节接原 v4.0.0 body；顺序以可读性为准，回执说明即可）
- **删除** `v4.0.0` release（`gh release delete v4.0.0 --yes`）；**git tag `v4.0.0` 保留不删**（tag 是不可变历史）
- 注意：两版 body 各自原文保留、不润色不改写

## 核对与回执

- 全量 36/36（37-1）标题 = `sciclaw <tag>` 且 body 合并语义正确（v4.0.0-ga body 含原两版内容）
- `git ls-remote` 确认 tag `v4.0.0` 与 `v4.0.0-ga` 仍在
- 回执 inbox-release/ack（附核对输出）

— Friday
