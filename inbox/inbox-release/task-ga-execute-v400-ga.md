# Task: GA 执行 —— tag v4.0.0-ga + Release + 转 public（Peter 计划批准，六判据全绿）

**From**: Friday ｜ **To**: Karen ｜ **Date**: 2026-09-21
**就绪声明**: inbox-results/ga-readiness-declaration-20260921.md（六判据全绿）｜ **版本策略**: 独立 `v4.0.0-ga` tag，package 版本保持 4.0.0 不变

## 任务

1. **notes-first**：GA release notes 文稿入仓 `docs/roadmaps/releases/v4.0.0-ga/v4.0.0-ga.md`（主题：GA = 生产可用判定达成——六判据核验表 + 已证能力栏 + 校准局限如实注；不得使用超出 readiness declaration 的宣称）
2. **tag** `v4.0.0-ga` @ main HEAD（annotated；守卫链将自动校验 tag↔版本互等与 Release body==notes）
3. **GitHub Release** 发布
4. **转 public**：`gh repo edit opensourceclaw/sciclaw --visibility public`（Peter 已授权"GA 判定通过当日转 public"；这是单一对外开关）
5. 转公开后核对：Actions 历史可见性、README/徽章渲染、issue 模板生效
6. 回执 inbox-release/ack

## 红线

- 版本号不动（4.0.0）；npm 不发布；对外措辞上限 = readiness declaration 事实面（可称 verifiable，须带校准局限注）

— Friday
