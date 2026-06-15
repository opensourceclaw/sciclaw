# Changelog

All notable changes to DeepClaw will be documented in this file.

## [3.0.0-beta.2] - 2026-06-16

### 🚀 Beta: Interactive Research

#### Added
- **Feedback Module (用户反馈)**
  - `src/interactive/feedback/` - 用户反馈收集与处理
  - FeedbackCollector: 支持 5 种反馈类型 (positive/negative/modify/supplement/pause)
  - FeedbackProcessor: 将反馈转换为研究动作

- **Query Optimizer (查询优化)**
  - `src/interactive/query_optimizer/` - 自适应查询优化
  - QueryRewriter: 4 条重写规则 (broad→specific, depth→in-depth 等)
  - QueryExpander: 8 组同义词扩展
  - QueryScheduler: priority + FIFO 调度算法

- **Progressive Builder (渐进式构建)**
  - `src/interactive/progressive/` - 分阶段报告构建
  - SectionSegmenter: 自动识别标题层级分割章节
  - SectionBuilder: 增量构建 + 依赖检测
  - ProgressPreview: 中间预览支持

- **Visualization (可视化)**
  - `src/interactive/visualization/` - 研究过程可视化
  - ProgressTracker: 实时进度跟踪
  - StatusDisplay: 状态展示 (idle/searching/analyzing/writing/done)

#### Testing
- 75 new interactive tests (100% passing)
- Overall coverage: 91.42%
- Interactive module coverage: 76.19%

---

## [3.0.0-beta.1] - 2026-06-15

### 🚀 Beta: Reasoning Enhancement

#### Added
- **Chain of Thought (思维链)**
  - `src/reasoning/chain_of_thought/` - 多步推理链
  - ProblemDecomposer: 问题分解器，支持复杂问题拆解
  - StepExecutor: 步骤执行器，支持 DAG 并行调度
  - ResultAggregator: 结果汇总器
- **Causal Analysis (因果分析)**
  - `src/reasoning/causal_analysis/` - 因果关系分析
  - VariableExtractor: 变量提取
  - CausalExtractor: 因果抽取（中英文模式）
  - GraphBuilder: 因果图构建
- **Explainer (可解释性)**
  - `src/reasoning/explainer/` - 推理可解释性
  - Logger: 推理日志（环形缓冲区）
  - Confidence: 置信度评估（4 因子）
  - Generator: 解释生成
- **Visualization (可视化)**
  - `src/reasoning/visualization/` - 思维链可视化
  - TreeGenerator: 推理树生成
  - Formatter: JSON/Markdown 导出

#### Testing
- 93 new reasoning tests (100% passing)
- Overall coverage: 91.68%
- Reasoning module coverage: 96.69%

#### Architecture
- ReasoningEngine: 统一入口，串联全流程
- DAG 拓扑序调度：无依赖步骤可并发执行
- LLMEngine 接口注入：可测试性

---

## [1.0.0] - 2026-05-06

### Added
- **User Feedback System**
  - `src/deepclaw/learning/feedback_collector.py` - 5 feedback types (quality, accuracy, relevance, completeness, usefulness)
  - CLI and API feedback collection
  - Integration with claw-mem for storage
- **Learning Pipeline**
  - `src/deepclaw/learning/learning_pipeline.py` - Feedback → Patterns → Rules → claw-rl bridge
  - Connects to claw-rl for learning
  - Context injection for future research

### Testing
- 38 new tests added
- 825 total tests (all passing)

### Changed
- **Version milestone**: Reaching v1.0.0 marks Phase 3 completion (Evolution)

## [0.8.0] - 2026-05-06

### Added
- **Claim Extraction**
  - `src/deepclaw/validation/claim_extractor.py` - 6 claim types (factual, numeric, quotation, comparison, causation, opinion)
  - Numeric and date extraction
  - Source attribution
- **Risk Scoring**
  - `src/deepclaw/validation/risk_scorer.py` - Risk calculation model
  - Risk levels: LOW, MEDIUM, HIGH, CRITICAL
  - Formula: Risk = Source×0.3 + Claim×0.3 + Verification×0.4
- **Fact-Check Service**
  - `src/deepclaw/validation/factcheck_service.py` - Abstract fact-check layer
  - Cross-verification support
  - Result caching

### Testing
- 59 new tests added
- 787 total tests (all passing)

## [0.7.1] - 2026-05-06

### Added
- **Source Validation API**
  - `src/deepclaw/validation/source_validator.py` - URL accessibility + SSL check
- **Authority Scorer**
  - `src/deepclaw/validation/authority_scorer.py` - Author/institution/citation scoring
- **Quality Transparency**
  - Quality score display in search results

### Testing
- 46 new tests added
- 728 total tests (all passing)

## [0.7.0] - 2026-05-06

### Added
- **Source Quality Scoring**
  - `src/deepclaw/validation/source_scorer.py` - Domain reputation + freshness scoring
  - Scoring model: Domain (40%) + Freshness (30%) + Authority (30%)
- **Citation Tracking System**
  - `src/deepclaw/validation/citation_tracker.py` - Full citation tracking
  - Tracks all sources used during research
- **Citation Formatting**
  - `src/deepclaw/validation/citation_formatter.py` - APA, MLA, Chicago support
  - In-text citations and bibliography formatting
- **Report Integration**
  - Auto-injected citations in generated reports
  - Support for multiple citation styles

### Improved
- **Validation Coverage**: 104 new tests for validation features
- **Report Quality**: All claims now have source attribution

### Testing
- 104 new tests added
- 682 total tests (all passing)

## [0.6.0] - 2026-05-06

### Added
- **OpenClaw Plugin Architecture**
  - `src/deepclaw/plugin/hooks.py` - Full plugin hook implementation
  - `src/deepclaw/plugin/plugin.json` - Plugin manifest with commands and config
  - `src/deepclaw/integration/memory_integration.py` - claw-mem/claw-rl adapter layer
  - Session lifecycle hooks: onSessionStart, onSessionEnd, onFeedback
- **Memory & Learning Integration**
  - Seamless claw-mem integration for memory storage/search
  - Seamless claw-rl integration for learning from feedback
  - Graceful fallback when dependencies unavailable

### Improved
- **Adapter Pattern**: Applied "防波堤" (breakwater) strategy for OpenClaw version compatibility
- **Test Coverage**: 45 plugin/integration tests added (100% pass)

### Changed
- Renamed project: ResearchClaw → DeepClaw
- Package name: `researchclaw` → `deepclaw`

## [0.5.0] - 2026-04-27

### Added
- **OpenClaw Skill Integration**
  - `skill/` directory with full OpenClaw Skill structure
  - `skill/SKILL.md` - Complete usage documentation
  - `skill/interface.py` - BaseResearchSkill and ResearchClawSkill classes
  - `skill/commands.py` - Command parser and handler
  - 7 example scripts in `skill/examples/`
- **Hook Integration**
  - `~/.openclaw/hooks/researchclaw/` - OpenClaw Hook
  - `HOOK.md` - Hook documentation
  - `handler.ts` - Event handler
  - Python bridge layer (`lib/bridge.py`)

### Improved
- **Error Handling**: Input validation, boundary checking, graceful degradation
- **Logging**: Added structured logging to skill methods
- **Test Coverage**: 613 tests with 100% pass rate
- **Documentation**: SKILL.md, HOOK.md, API.md all complete

### Fixed
- Empty topic/query/prompt handling
- Parameter validation (depth, limit, temperature clamping)
- Error messages for failed operations

## [0.4.0] - 2026-04-26

### Added
- **Web UI**: New React-based web interface
  - SearchPage, ResultsPage, ReportPage
  - Beautiful responsive design with Tailwind CSS
- **i18n Support**: Multi-language web interface
  - English (en) and Chinese (zh) support
  - Language switcher with localStorage persistence
  - Browser language detection
- **REST API Server**: FastAPI-based API with:
  - Search, research, and report endpoints
  - WebSocket support for real-time updates
  - API key authentication
  - GZip response compression
- **CLI i18n**: Command-line interface in English/Chinese

### Improved
- **Test Coverage**: 533+ tests with 100% pass rate
- **Build Performance**: Optimized production builds
- **UI/UX**: Enhanced user experience with loading states and animations
- **API Performance**: Search result caching, compression, optimized responses
- **Cache System**: Configurable TTL for search and general caching

### Fixed
- TypeScript compilation errors in web UI
- Component import paths
- i18n integration with React components
- Version numbers across codebase

## [0.3.0] - 2026-04-26

### Added
- **LLM Integration Framework**: Multi-provider LLM support (DeepSeek, GLM, MiniMax, Kimi, Qwen)
- **Synthesizer V2**: New synthesis engine with theme extraction and structured output
- **Smart Sectioning**: Automatic report section organization
- **Enhanced Report Generator**: Multi-format output (Markdown, HTML, JSON) with citation styles
- **Summarization Module**: Key facts extraction, summarization engine
- **Content Retry Logic**: Robust retry mechanism with exponential backoff

### Improved
- **E2E Research Flow**: Complete research pipeline from search to report
- **Test Coverage**: 505+ tests with 99%+ pass rate
- **Provider Flexibility**: Easy addition of new LLM providers

### Fixed
- Content extraction for various site types
- Site-specific parser registration
- Report generation edge cases

## [0.2.0] - 2026-04-26

### Added
- **Multi-engine Search Support**: DuckDuckGo, Bing, Microsoft Search providers
- **Enhanced Content Extraction**: 
  - Multiple extraction strategies (OG tags, selectors, text density, readability)
  - Parallel content extraction with progress tracking
  - Site-specific parsers (GitHub, Medium, Hacker News, V2EX, etc.)
- **Source Validation**: URL validation, quality scoring, content type filtering
- **Report Generation**: Markdown, HTML, JSON export with citation formatting (APA, Markdown)
- **Rich CLI Output**: Beautiful console output with progress bars and tables
- **JS Detection**: Automatic detection of SPA/JS-heavy sites

### Improved
- **Performance**: Optimized extraction with session reuse, caching
- **Error Handling**: Graceful degradation with detailed error messages
- **Test Coverage**: 99%+ pass rate with 303 tests

### Fixed
- CLI command output formatting
- Init command with isolated filesystem
- Performance test timeouts

## [0.1.0] - 2026-04-01

### Added
- Initial release
- Basic search functionality
- Simple content extraction
- CLI interface

---

For full documentation, visit: https://github.com/liantian-cn/researchclaw

## v1.0.0 (2026-05-07)

- chore: restructure directory layout to devclaw standard
- Move config/skill json to configs/, caches to data/cache/
