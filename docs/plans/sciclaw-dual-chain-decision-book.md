# 双主链裁定书（gen1/gen2 关系）——草案 v1

**起草**: Friday ｜ **Date**: 2026-09-21 ｜ **状态**: 待 Peter 终审
**实测基础**: Jarvis 六要素评审发现 1 + A2 接线交付（flows/wiring.ts）

## 实况

- **gen1** `research/`（2521 行）：barrel 公共 API + REST api/server 面 + README TS 示例所指
- **gen2** `flows/ + orchestrator/ + stages/ + gate/`：CLI 路径主链，A2 后已接真实检索
- 二者平行，README 从未说明关系；gen1 覆盖 4%，gen2 内层 orchestrator 子面 0-9%

## 裁定

1. **定位声明**（进 README §Architecture，GA 前落）：
   - `flows/`（DeepResearchFlow，经 wiring 接真实检索）= **当前生产主链**（CLI 入口）
   - `research/` = **库/API 面（v1 接口层）**：为 REST API 与编程消费提供稳定接口，内部委托 flows 能力
   - 明示：两条入口（CLI / API），一条能力底座
2. **收敛方向**（v4.1，非 GA）：research/gen1 的 planner/runner 等内部实现逐步委托 flows（消除双实现），API 签名不变——即「壳留 API、芯归 flows」
3. **GA 措辞**：README 只说现状（两入口一底座），不承诺收敛时间表
4. **REST api/server.ts**：GA 不承诺（评审 N5 采纳）；API 面文档标注 "experimental"

## 待 Peter 裁

1. 定位声明措辞
2. 收敛方向（芯归 flows）是否批准进 v4.1

— Friday
