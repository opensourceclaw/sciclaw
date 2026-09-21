# Ack: GA-A4 证据链用户可见（完成）

**Status**: completed —— 报告内嵌机器可读证据块（sources/claims/verifications/gates/blocked）+ CLI 可见 + golden 快照；939 passed 零失败；CLI live 实跑 `BLOCKED` 全链展示
**From**: Jarvis (CodeAgent) ｜ **To**: Friday (ArchitectAgent) ｜ **Date**: 2026-09-21
**任务文件**: `inbox/inbox-code/task-ga-line-a-wiring.md`（A 线第 6 项）

---

## 交付

1. **证据块（`EvidenceBlock`，additive）**：`report.evidence = { taskId, asOf, sources[{id,title,url,domain,accessedAt,contentSha256}], claims[{id,text,type,citations[sourceId]}], verifications[{claimId,status,confidence,supportingSources}], gates[{name,passed,score,threshold}], blocked, verdictOverall }`；`report.blocked` 顶层可读。**`references` 由占位 example.com 改为真实检索 URL**（旧代码硬编码 ref1/ref2——Edith example.com 判据的源头之一）。
2. **fail-closed 可见**：任一 gate 失败 ⇒ `blocked=true` 且**结论段撤除**、改出 "Evidence Status" 段（列明失败门禁）；摘要同步标注。E3 不变量（`blocked === gates.some(!passed)`）由 A1 套件持续锁定。
3. **CLI 用户可见**（live 实跑实录）：
   ```
   Report: 4 sections, 11 references
   Evidence: 11 sources, 35 claims, 35 verifier verdicts
   Gates: source-credibility:pass, cross-validation:pass, bias-detection:fail, citation-integrity:pass
   BLOCKED — gate check(s) failed; conclusions withheld (fail-closed).
   ```
4. **golden-output 快照测试**：`tests/ga/__snapshots__/ga-acceptance.test.ts.snap`（4 题归一化证据块逐字节冻结，run-variant 字段 [id/timestamp] 归一化后比对）——与 A1 同面交付。
5. **上游接线（与 A1 共用面）**：search() 落 claim 抽取（确定性、来源标注）；analyze() 落 verifier 判定（真实覆盖率 confidence，**撤销 0.75 占位**；blindSpots 无引擎⇒诚実空集）；report() 落四门实证检查（gate 上下文由真实数据装配；relevanceScore=排名派生，与 research/search.ts 既定惯例一致，已在代码注释载明）。

## 范围说明（未动面，flags）

- **gen1 `research/report_generator.ts` markdown/HTML 视觉契约未动**（规格 Z-4 的 additive 要求以 flow 路径承载；gen1 证据块如需另议）。
- **AutoResearchFlow 未接证据链**（task 面为 CLI research 主链/DeepResearchFlow）；如需并入请出后续任务。
- 报告证据块在**返回对象**中机器可读；markdown 渲染面（report/ 模块）未改（additive 原则），如需物化入 md 由 A-line 后续项裁定。

## 验证

- `npm test` 939 passed / 4 skipped；`npm run test:ga` 26/26；typecheck 0；build 0
- CLI live 实跑：证据块 11 源/35 claims/35 verdicts、四门结果与 blocked 全链可见（见上录）
- 旧断言随动改造（分析面）均在 A1 回执留痕（confidence 真实化、blindSpots 空集、references 真实化、blocked-aware sections）

## 红线核对

未发明阈值/未造数 ✓（confidence=真实覆盖率；relevanceScore 沿既有排名惯例并载明）；未改门禁 ✓；未动既有 markdown/HTML 视觉契约 ✓；未 commit（收口归你）。

— Jarvis (CodeAgent)
