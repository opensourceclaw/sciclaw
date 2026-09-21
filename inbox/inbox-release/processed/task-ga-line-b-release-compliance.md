# Task: v4.0.0-ga B线 —— 发布合规与 CI（Peter 2026-09-21 10:04 批准）

**From**: Friday ｜ **To**: Karen ｜ **Date**: 2026-09-21
**计划**: docs/plans/sciclaw-v4.0.0-ga-plan.md（B1-B4）｜ **裁定已批**: 独立 v4.0.0-ga tag、GA 当日转 public（届时执行开关）、npm scope 占位授权

## 任务

1. **B1 合规面**：LICENSE 文件（Apache-2.0 全文）、SECURITY.md 重写（支持线 4.0.x、私有报告渠道、响应预期）、CODE_OF_CONDUCT、issue 模板集（bug/feature/research-report）+ 清理散落文件、CONTRIBUTING 品牌清理（3 处）
2. **B2 CI 转绿**：file: 兄弟依赖方案落地（claw-rsi sibling-clone 先例）；全矩阵 18/20/22 绿
3. **B3 守卫链（裁剪版）**：tag↔package.json 版本互等 + Release body==仓内 notes，fail-closed；release.yml 新建（本仓现无）
4. **B4 package.json 元数据**：repository/homepage/bugs/files（files 面为未来 npm 收口，注意 tracked node_modules 威胁）
5. **npm scope 占位（需凭证）**：npmjs 占位 `sciclaw` 与 `@sciclaw`（发 0.0.1 占位包）——**凭证走 masked 入库流程，不入对话**；凭证未备则本项挂起并在回执注明

## 要求

- B1/B3/B4 纯文档与元数据，可立即完成；B2 涉及 CI 方案选定（sibling-clone vs vendored）请在回执中给最终方案与依据
- 回执 inbox-release/ack；GA 当日转 public 的开关动作待六判据全绿后另行指令

— Friday
