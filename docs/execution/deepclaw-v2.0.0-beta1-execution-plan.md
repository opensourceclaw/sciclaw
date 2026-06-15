# DeepClaw v2.0.0-beta.1 执行计划: Python → TypeScript 迁移

**规划日期**: 2026-06-14
**负责人**: Jarvis (开发), Friday (验收)
**版本**: v2.0.0-beta.1
**状态**: 📋 等待执行

---

## 1. 概述

### 背景
- DeepClaw v1.0.0 是纯 Python 项目
- 与 OpenClaw 生态技术栈不一致（其他项目均为 TypeScript）
- 需要保持与 OpenClaw 插件标准兼容

### 目标
- 将 DeepClaw 从 Python 迁移到 TypeScript
- 保持现有功能兼容
- 符合 OpenClaw 插件标准

### 范围
| 包含 | 不包含 |
|------|--------|
| 项目结构重构 | 业务逻辑重写 |
| 依赖迁移 | Knowledge Graph (v2.0.0-beta.2) |
| CLI 迁移 | 新功能开发 |
| API 迁移 | |
| 测试迁移 | |

---

## 2. 任务分解

### Phase 1: 项目结构重构

| 任务 | 文件 | 说明 |
|------|------|------|
| **1.1** 创建 TypeScript 项目结构 | - | 初始化 package.json, tsconfig.json |
| **1.2** 创建 OpenClaw 插件配置 | `openclaw.plugin.json` | 符合官方标准 |
| **1.3** 建立目录映射 | - | Python src/ → TS src/ 结构 |
| **1.4** 配置构建系统 | build/, dist/ | tsc + vite/esbuild |

### Phase 2: 依赖迁移

| 任务 | 文件 | 说明 |
|------|------|------|
| **2.1** 分析 Python 依赖 | pyproject.toml | 列出所有依赖 |
| **2.2** 找到 TS 等价物 | - | mapping 表 |
| **2.3** 创建 package.json | package.json | npm 依赖 |
| **2.4** 安装并验证 | node_modules | 无冲突 |

**依赖映射表**:

| Python 包 | TypeScript 等价 |
|-----------|-----------------|
| openclaw | openclaw (官方) |
| requests | axios / node-fetch |
| beautifulsoup4 | cheerio / jsdom |
| click | commander / yargs |
| rich | chalk / ora |
| lxml | libxmljs |
| html2text | turndown |
| ddgs | duck-duck-scrape |
| fastapi | express / fastify |
| pydantic | zod / io-ts |
| weasyprint | puppeteer (PDF) |

### Phase 3: CLI 迁移

| 任务 | 文件 | 说明 |
|------|------|------|
| **3.1** 分析现有 CLI 命令 | deepclaw/cli/ | 列出所有命令 |
| **3.2** 创建 TS CLI 框架 | src/cli/index.ts | commander |
| **3.3** 迁移命令实现 | src/commands/*.ts | 一一对应 |
| **3.4** 配置 npm scripts | package.json | "bin" 字段 |

**现有 CLI 命令** (需迁移):
```
deepclaw search <query>     # 搜索
deepclaw research <topic>   # 深度研究
deepclaw report             # 生成报告
deepclaw serve              # 启动 API
```

### Phase 4: API 迁移

| 任务 | 文件 | 说明 |
|------|------|------|
| **4.1** 分析现有 API | fastapi endpoints | 列出所有接口 |
| **4.2** 创建 TS API 框架 | src/api/index.ts | express/fastify |
| **4.3** 迁移路由定义 | src/api/routes/*.ts | RESTful |
| **4.4** 迁移请求处理 | src/api/handlers/*.ts | 业务逻辑 |

**现有 API 端点** (需迁移):
```
POST /api/search           # 搜索
POST /api/research         # 深度研究
GET  /api/report/<id>      # 获取报告
POST /api/report/<id>      # 生成报告
GET  /api/status           # 服务状态
```

### Phase 5: 核心模块迁移

| 任务 | 模块 | 说明 |
|------|------|------|
| **5.1** 迁移搜索引擎 | src/search/ | 多引擎搜索 |
| **5.2** 迁移提取器 | src/extractor/ | 内容提取 |
| **5.3** 迁移去重 | src/dedup/ | 去重逻辑 |
| **5.4** 迁移报告生成 | src/report/ | Markdown/HTML |

### Phase 6: 测试迁移

| 任务 | 说明 |
|------|------|
| **6.1** 创建 vitest 配置 | vitest.config.ts |
| **6.2** 迁移单元测试 | pytest → vitest |
| **6.3** 迁移集成测试 | tests/integration/ |
| **6.4** 配置 CI | GitHub Actions |

**测试覆盖率目标**: ≥70%

---

## 3. 验收标准

### 功能验收
- [ ] CLI 命令与 v1.0.0 功能一致
- [ ] API 端点与 v1.0.0 兼容
- [ ] 搜索结果质量不下降
- [ ] 报告生成格式一致

### 技术验收
- [ ] `npm run build` 成功
- [ ] `npm test` 通过率 ≥70%
- [ ] 符合 OpenClaw 插件标准
- [ ] 类型检查无错误 (strict mode)

### 交付物
| 文件 | 说明 |
|------|------|
| `package.json` | npm 项目配置 |
| `tsconfig.json` | TypeScript 配置 |
| `openclaw.plugin.json` | OpenClaw 插件配置 |
| `src/` | 源代码 |
| `dist/` | 构建输出 |
| `tests/` | 测试文件 |

---

## 4. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 依赖无 TS 等价物 | 高 | 使用通用方案 (axios, cheerio 等) |
| 业务逻辑复杂 | 中 | 分阶段迁移，每阶段可运行 |
| PDF 生成兼容 | 中 | weasyprint → puppeteer |
| 测试覆盖不足 | 中 | 优先迁移核心模块测试 |

---

## 5. 时间估算

| Phase | 预估时间 |
|-------|----------|
| Phase 1-2 (结构+依赖) | 2-3 小时 |
| Phase 3-4 (CLI+API) | 3-4 小时 |
| Phase 5 (核心模块) | 4-6 小时 |
| Phase 6 (测试) | 2-3 小时 |
| **总计** | **11-16 小时** |

---

## 6. 执行流程

```
1. Friday: 发送任务给 Jarvis（包含本计划）
    ↓
2. Jarvis: 按 Phase 顺序执行
    ↓
3. Jarvis: 提交代码 + 测试报告
    ↓
4. Friday: 验收 (build + test)
    ↓
5. Edith: 独立验收测试
    ↓
6. Friday: 发布 v2.0.0-beta.1
```

---

*执行计划 by Friday — 2026-06-14*