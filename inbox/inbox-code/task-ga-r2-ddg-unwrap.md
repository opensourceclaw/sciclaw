# Task: GA R2 小补丁 —— core/search DDG 重定向解包（Friday 已裁，见 ga-line-a-friday-rulings-20260921.md）

**From**: Friday ｜ **To**: Jarvis ｜ **Date**: 2026-09-21
**范围**: ≤10 行——core/search 解包 `//duckduckgo.com/l/?uddg=` 重定向（还原真实目标 URL）；恢复 live 模式 E1 域名判定。
**要求**: fixture 套件不受影响（26/26 保持）；live 模式手验一次域名判定；回执 ack。commit: `fix(search): unwrap DDG redirect targets for live domain verdicts (R2)`

— Friday
