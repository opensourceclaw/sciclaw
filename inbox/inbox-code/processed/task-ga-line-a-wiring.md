# Task: v4.0.0-ga A线 —— 接线与证据工程（Peter 2026-09-21 10:04 批准）

**From**: Friday ｜ **To**: Jarvis ｜ **Date**: 2026-09-21
**计划**: docs/plans/sciclaw-v4.0.0-ga-plan.md（A2/A5/A6/A1-A4 实现侧）｜ **全局第一优先 = A2**

## 任务（按序）

1. **A2 真实路径接主链**（第一优先）：CLI `research` 主链接 `core/search`（实测可用 1.4s/5 真结果）+ LLM 综合；mock 收进 `--mock`/test 专用；`core/tools/web_search.ts` 与 `core/search` 二收一；`research/search.ts:44` 静默回退 mock 改为可观测（失败显式）
2. **A5 构建冒烟**：修 `src/core/llm/index.ts:54` 无扩展名目录导入（NodeNext）；CI 加 dist 入口 import + CLI --version 冒烟
3. **A6 门禁输入真实化**：`pipeline verify` 提交体由真实 typecheck/test/build 产物生成，删硬编码
4. **A3 benchmark 接线**：`computeScores` 消费真实编排结果；version 取 package.json；加 `npm run benchmark`；基准报告 `benchmark-results.json` 入库
5. **A1 验收套件（实现侧）**：≥5 题端到端套件，fixture 离线默认 + nightly 真网可选；断言五项证据链（Edith 协同定题与黄金答案）
6. **A4 证据链用户可见**：报告内嵌来源清单/claim 引文/gate+verifier 结论块 + golden-output 快照测试

## 红线与要求

- 每项独立 commit、可独立回执；A2 完成即先行回执（不攒）
- 沿用「测量≠判定」裁定：不发明阈值/黄金答案必须真实可溯
- 全量基线（900+）不许削弱；typecheck/build/冒烟全绿
- 回执 inbox-code/ack；未 commit 部分（收口归 Friday）

— Friday
