# 死面决策书（C3）——12 个零消费模块逐块裁定（草案 v1）

**起草**: Friday ｜ **Date**: 2026-09-21 ｜ **状态**: 待 Peter 终审
**依据**: Jarvis 六要素评审实测（import 图可达性 / 覆盖率 / 最后实质改动）+ A3 交付后新增观测（R5）
**裁决口径**: ①用户路径可达性 ②家族叙事相关性 ③维护成本（覆盖与体量）④AutoResearchFlow（v5）潜在复用

## 裁定总表

| 模块 | 行数 | 覆盖 | Friday 裁定 | 理由 |
|---|---:|---:|---|---|
| multimodal | 2462 | 66% | **移除**（v4.1 执行） | 最大死面；README 叙事与 AI4S 定位均不含图像/视觉研究；git 历史可溯，删除零风险 |
| monitoring | 841 | 91% | **移除**（v4.1） | observe 面已接管其职责（R5 后三面并存→二面）；与 C4 合并执行 |
| interactive | 1185 | 90% | **移除**（v4.1） | CLI gen2 已有交互路径；语义重复 |
| trigger | 491 | 73% | **移除**（v4.1） | 零消费；调度需求由 harness（automations）承担 |
| approval | 635 | 72% | **收敛**（v4.1）：CLI approve 命令保留，库面并入 cli/ | 人审门语义有价值，双实现多余 |
| summarization | 1147 | 94% | **收敛**（v4.1）：与 core/nlp 能力比对后二选一 | 需一次能力比对实测后定去向 |
| experiment | 1230 | 91% | **收敛**（v4.1）：并入 hypothesis（同为 v5 AutoResearchFlow 预研面） | 两面同属实验循环语义 |
| governance | 292 | 0% | **收敛**（v4.1）：0 覆盖+零消费，与家族 claw-gov 职能重叠 | 家族有专职组件，本仓不应自建 |
| cog-integration | 252 | 0% | **接线**（v4.1，与 memory-adapter 同批） | 家族集成实件——"家族协同"宣称的兑现面（sciclaw 六要素⑤缺口） |
| memory-adapter | 206 | 0% | **接线**（v4.1，同上） | claw-mem adapter 接线 = 家族协同叙事的实证 |
| hypothesis | 975 | 99% | **保留**（冻结至 v5） | AutoResearchFlow 核心预研件，高覆盖低维护 |
| reasoning | 859 | 100% | **保留**（冻结至 v5） | 同上 |

## 执行方式

- **GA 前零删除**（避免在对外前夜动 10k 行）；本决策书入 GA 交付 = "已知死面 + 处置承诺"
- v4.1 单任务分批执行：移除批（multimodal/monitoring/interactive/trigger，~-5k 行）→ 收敛批（4 项）→ 接线批（2 项）
- 每批独立 PR + 全量基线验证；`DEPRECATED-` 标注过渡一版

## 待 Peter 裁

1. 本表整体批准/修改
2. multimodal 是否征询过任何真实使用需求（若有用户依赖则降为收敛）
3. 接线批（cog-integration/memory-adapter）排 v4.1 还是 v5（涉及"家族协同"宣称何时兑现）

— Friday
