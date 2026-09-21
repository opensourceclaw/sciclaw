# Ack: SciClaw v4.0.0 发布完成

**Status**: complete —— tag / Release / notes-first / 质量实测 全链取证，发布零代码 diff
**From**: Karen (ReleaseAgent) ｜ **To**: Friday (ArchitectAgent) / Peter (Owner)
**Date**: 2026-09-21 ｜ **Stage**: RELEASE
**Task**: `inbox/inbox-release/task-release-v4.0.0-sciclaw.md`（Peter 09:04 批）
**Project**: opensourceclaw/sciclaw（**private**，GitHub 已 rename，remote 已指向 sciclaw）

---

## 执行结果

| 步骤 | 结果 |
|------|------|
| notes-first | ✅ 仓内文稿 `docs/roadmaps/releases/v4.0.0/v4.0.0.md`（本仓惯例 = `vX.Y.Z/` 目录 + `<version>.md`，同 v3.0.0 先例），commit `dbf263c` |
| Push main | ✅ `7e4e33b..dbf263c`；origin/main == HEAD == `dbf263c` |
| tag v4.0.0 | ✅ 双核：local `v4.0.0^{commit}` = **`dbf263c`**；GH API tag object `1abab6c` → commit **`dbf263c`**；**== main HEAD** |
| GH Release | ✅ https://github.com/opensourceclaw/sciclaw/releases/tag/v4.0.0 —— `isDraft=false`、`isPrerelease=false`、`targetCommitish=main`、title「SciClaw v4.0.0 — identity integration milestone」 |
| body 核验 | ✅ 与仓内文稿**逐字节相同**，仅 GitHub 追加一个尾随换行（2766B → 2767B）；非 `--generate-notes` 产物 |
| 发布零 diff | ✅ `git diff --stat v4.0.0..HEAD` **空**、`git log v4.0.0..HEAD` **空**（tag 即 main HEAD，无新代码 commit） |
| 质量实测（本地，非沙箱） | ✅ **900 passed / 71 files**（`npm test`）；`tsc --noEmit` exit 0；`npm run build` exit 0；**dist 重建后无 tracked diff**（快照与 src 同源） |
| npm 面 | ✅ 本仓无 registry 面 ⇒ 不发布、dist-tags 不适用（跳过，与任务书一致） |

## 与任务书/计划不一致处（如实上报）

1. **目标 SHA 过期（已在执行中自行裁定）**：任务书写 tag @ `44612f2`，计划文件写 @ `d2d20b1`，但 `44612f2` 已被 09:20/09:25 两次口径修订的后续提交取代（`ee44c99`/`4040898`/`8b8754d`/`7e4e33b`），且已**不在 main 祖先链上**；`d2d20b1` 亦非 tip。按任务书操作口径「tag @ main HEAD」（且发布须含定位修订后的 README/CHANGELOG/计划），tag 取当时 HEAD `dbf263c`（= notes commit）。**如要求严格钉住某 commit，可复议**（重指 tag 需同步 GH Release）。
2. **CI 长期全红（结构性，非本次引入，**建议 GA 线处理**）**：push 触发 `ci.yml` 必红——根因是三个家族依赖以 `file:../claw-cog` / `file:../claw-ctx` / `file:../claw-mem` 声明，GitHub runner 内无同仓兄弟目录 ⇒ `npm ci` 后 `TS2307 Cannot find module 'claw-cog' / 'claw-ctx' / 'claw-mem'`，**Build 与 Type check 双失败**（Node 18/20/22 矩阵连带 cancel）。历史回溯：v3.7.0（07-24）起、v3.8.0、v3.9.0 至 v4.0.0 均红，仅 scheduled Code Quality 有成功记录 ⇒ **非 v4.0.0 回归**。本次不阻断发布（本仓无 `release.yml`，tag 不触发发布流程），但「900/900 全绿」当前**只有本地证据，CI 无法背书**。GA 前建议：照 claw-rsi `release.yml` 先例加 sibling clone 步骤（家族已实证可行），或把三个 file: 依赖改为 vendored/registry 面。
3. **工作树噪声**：本仓 `node_modules/` 被 git 跟踪（9994 文件）。测试/build 会改动 `node_modules/.vite/vitest/**/results.json`（tracked）等产物；**本次仅提交 notes 文件，未提交任何 node_modules 改动**。另捕获并行活动痕迹：`D node_modules/@sciclaw/core`、`D inbox/inbox-test/task-review-six-elements-edith.md`（非我所为）。
4. **核验环境差异（如实记录）**：沙箱内首跑 894/900（1 failed）——失败项 `tests/api/index.test.ts > server starts and responds to status`，根因 `listen EPERM ::1:3098`（我方沙箱禁止端口绑定），**非产品缺陷**；非沙箱复跑该文件 7/7、全量 **900/900** 通过。故「900/900」结论成立，但需注明其取证环境。

## 验收对照（任务书 §验收）

- ✅ tag `v4.0.0` 指向 main HEAD（双核取证；SHA 见上「不一致处 1」说明）
- ✅ GH Release 存在；notes 与仓内文稿一致（逐字节 + 尾换行）
- ✅ main 无新代码 commit（发布零 diff）

— Karen (ReleaseAgent)
