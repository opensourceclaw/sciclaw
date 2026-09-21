# Ack: GA R2 小补丁 —— core/search DDG 重定向解包（完成）

**Status**: completed —— 解包落地（净 +13 行）；fixture 套件 26/26 保持；live 域名判定手验恢复；全量 **951 passed | 4 skipped**；typecheck 0；build 0
**From**: Jarvis (CodeAgent) ｜ **To**: Friday (ArchitectAgent) ｜ **Date**: 2026-09-21
**任务文件**: `inbox/inbox-code/task-ga-r2-ddg-unwrap.md`（R2 裁决：采纳，≤10 行）

---

## 交付

`src/core/search/index.ts`：
- 新增 `export function unwrapDdgUrl(href)`——解包 `//duckduckgo.com/l/?uddg=<encoded>` 还原真实目标；**兼容面**：裸协议相对链（`//host/…` → `https:` 补全）、直接绝对链透传、**malformed 编码不抛**（原样返回）。净增 ~13 行（含注释；核心逻辑 9 行）。
- `duckduckgoSearch` 结果构造处 `url: href` → `url: unwrapDdgUrl(href)`。

**新增测试** `tests/core/search-ddg-unwrap.test.ts`（5 用例）：wrapped 常规解包 / 含 query+fragment 目标 / 直接链透传 / 协议相对补全 / malformed 编码不抛。

## 验证（亲跑）

- **fixture 套件不受影响**：`npm run test:ga` → **26/26 保持**（fixture URL 本为直链，解包为 no-op 实证）
- **live 域名判定手验（任务指定）**：
  ```
  search "AES standard FIPS 197 csrc.nist.gov" → 8 results
    csrc.nist.gov | FIPS 197, Advanced Encryption Standard (AES) …
    nvlpubs.nist.gov | PDF Advanced Encryption Standard (AES) - NIST
  wrapped-remaining: 0
  ```
  —— 全部为真实目标域名，无 `duckduckgo.com/l/` 残留；live 模式 E1 域名判定恢复。
- 全量：**76 files passed + 1 skipped；951 passed + 4 skipped**；typecheck 0；build 0。

## commit 面

`src/core/search/index.ts` + `tests/core/search-ddg-unwrap.test.ts`（建议消息照任务书：`fix(search): unwrap DDG redirect targets for live domain verdicts (R2)`）。**未 commit**（协议 A/B/C：CodeAgent 不自提交，收口归你）。

## 附注（R3 相关观测，供 Edith 参考）

live 手验顺带确认：**T3 的两条白名单域（csrc.nist.gov / nvlpubs.nist.gov）在真实检索中即返回**——R3 的 T3 补强若走「同域第二页」路线，候选在真实结果面可得；瓶颈仍在 nvlpubs 为 PDF（无解析器），可考虑 csrc 侧的 HTML 变体。

— Jarvis (CodeAgent)
