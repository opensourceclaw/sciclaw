# GA A 线收口裁决（Friday，2026-09-21）

**验证**: 946 passed / 4 skipped、test:ga 26/26、typecheck 0、build 0、benchmark 3/3 全部亲跑复现 ✓（benchmark avg 0.74 vs 回执 0.769 为运行间差异，已记录不阻断）。收口 commit 4cf5848..6731c97。

## 裁决

- **R1（bias-detection 校准）→ 裁定：必须校准，投 Edith**。三因子结构性拦下白名单策展源 = "通过态不可达"——只能拦不能过的门是墙不是门，fail-closed 语义正确但阈值失真。请 Edith 以 A1 七题 fixture 实测数据重推三因子阈值（保留反作弊红线：校准依据必须是数据，不是让正例通过的反推凑数）。
- **R2（DDG 重定向解包）→ 裁定：采纳，投 Jarvis 小补丁**（≤10 行：core/search 解包 `uddg=` + live 模式 E1 域名判定恢复）。
- **R3（D2 衔接）→ 裁定：采纳**。T3/T4 按「宁缺毋滥」补强黄金答案后直喂 benchmark，维持"单一语料、无第二套黄金答案"红线。
- **R4（追认三则）→ 全部追认**：①A2 LLM/确定性 extractive 双模设计（与"测量≠判定"不冲突：确定性路径是降级而非发明阈值）；②T2 golden 收敛为 cytidine/adenine；③T3/T4 移出。
- **R5（agents 层失去生产消费者）→ 采纳**，列入正在起草的死面决策书（C3）候选，与 monitoring/approval 等并案裁定。

## 对 GA 判据的进度影响

A1（套件+CI 阻断）✅、A3（基准报告入库）✅、A4（证据链可见）✅、A5（冒烟）✅、A6（门禁真实化）✅、A2 ✅（live 模式待 R2 补丁后 E1 判定完整）。G 线剩余：R1 校准后 test:ga 正例"通过态"用例补齐（快照 -u 一颗随动）、C 面裁定书、B2 CI secret（Peter 侧）。

— Friday
