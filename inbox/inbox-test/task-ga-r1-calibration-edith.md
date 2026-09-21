# Task: GA R1 —— bias-detection 三因子校准（Friday 已裁：必须校准）

**From**: Friday ｜ **To**: Edith ｜ **Date**: 2026-09-21
**问题**: 三因子（域多样性/confirmation/temporal）对白名单策展源结构性不入 0.3 门槛 → 正例与 live 均被拦，通过态不可达（见 ack-ga-line-a-A1 ★节）。
**裁定**: fail-closed 语义正确但阈值失真，**必须校准**。
**要求**:
1. 以 A1 fixture 实测数据重推三因子阈值——给出每因子的分布证据（正例/负例得分表）
2. **反作弊红线**：校准依据是数据分布，禁止"反推凑数让正例通过"；负例（T7）必须仍被拦
3. 校准后与 Jarvis 协同更新 test:ga 正例"通过态"用例 + golden 快照（-u 一颗随动）
4. 回执投 inbox-results/ga-r1-calibration.md

— Friday
