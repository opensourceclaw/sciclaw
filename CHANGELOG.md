# Changelog

All notable changes to DeepClaw will be documented in this file.

## [3.5.0] - 2026-07-17

### 🎯 AI-Native Maturity Enhancement

This release enhances DeepClaw's AI-Native maturity with Gate enforcement, Pipeline CLI, and English-only source code.

#### Added — Gate Enforcement System

- **Gate Types** (`src/gate/types.ts`) - GateStatus, GateState, ValidationResult
- **GateRegistry** (`src/gate/GateRegistry.ts`) - Gate status persistence and management
- **InternalVerifyGate** (`src/gate/gates/InternalVerifyGate.ts`) - 9 validation rules (6 failed + 3 warning)
  - Failed rules: type_check_failed, build_failed, tests_failed, incomplete_tests, regression_failed, config_error
  - Warning rules: chinese_characters_detected, hardcoded_paths_detected, missing_apache_headers

#### Added — Pipeline CLI

- **Pipeline Types** (`src/cli/types.ts`) - PipelineStage, PipelineState, StageState
- **Pipeline Coordinator** (`src/cli/pipeline-coordinator.ts`) - Pipeline state management
- **CLI Commands**:
  - `deepclaw pipeline create <topic>` - Create new pipeline
  - `deepclaw pipeline start <id>` - Start execution
  - `deepclaw pipeline status [id]` - Show status
  - `deepclaw pipeline approve <id> <stage>` - Approve stage
  - `deepclaw pipeline verify <id>` - Run verification gate
  - `deepclaw pipeline list` - List all pipelines
  - `deepclaw pipeline delete <id>` - Delete pipeline

### Changed

- Removed all Chinese characters from source code (100% English-only)
- Updated Chinese keyword patterns to English equivalents in synthesis modules
- Changed "知乎" to "Zhihu" in site-specific parser
- Changed "通义千问" to "Qwen (Alibaba Cloud)" in provider documentation

### Tests

- Added 16 tests for InternalVerifyGate
- Added 13 tests for PipelineCoordinator
- Total: 29 new tests

## [3.4.0] - 2026-07-04

### 🎯 100% TypeScript Migration

This release completes the migration from Python/TypeScript hybrid to **100% TypeScript**.

#### Added — LLM Module (TypeScript)
- **Types** (`src/llm/types.ts`) - MessageRole, ChatMessage, ChatCompletion, EmbeddingResult
- **Base Classes** (`src/llm/base.ts`) - LLMProvider abstract class, LLMProviderRegistry
- **Engine** (`src/llm/engine.ts`) - Unified LLMEngine interface
- **Providers**:
  - DeepSeek (`src/llm/providers/deepseek.ts`)
  - Qwen (`src/llm/providers/qwen.ts`)
  - Kimi/Moonshot (`src/llm/providers/kimi.ts`)
  - GLM/Zhipu (`src/llm/providers/glm.ts`)
  - MiniMax (`src/llm/providers/minimax.ts`)

#### Added — Research Module (TypeScript)
- **Planner** (`src/research/planner.ts`) - Research planning with sub-topics
- **Search Engine** (`src/research/search.ts`) - Multi-engine search with caching
- **Synthesizer** (`src/research/synthesizer.ts`) - Content synthesis
- **LLM Synthesizer** (`src/research/synthesizer_v2.ts`) - LLM-powered synthesis
- **Smart Sectioning** (`src/research/smart_sectioning.ts`) - Intelligent section detection
- **Report Generator** (`src/research/report_generator.ts`) - Markdown/HTML/JSON output
- **Runner** (`src/research/runner.ts`) - Research workflow orchestration

#### Added — Tools Module (TypeScript)
- **Web Search** (`src/tools/web_search.ts`) - DuckDuckGo, Google, Bing
- **Content Extraction** (`src/tools/content_extraction.ts`) - Cheerio-based extraction
- **Source Validation** (`src/tools/source_validation.ts`) - URL validation, quality scoring
- **PDF Export** (`src/tools/pdf_export.ts`) - PDFKit with APA/MLA formatting
- **Retry Logic** (`src/tools/retry.ts`) - Exponential backoff, error classification
- **Report Formatter** (`src/tools/report_formatter.ts`) - Citation formatting
- **Site Specific** (`src/tools/site_specific.ts`) - 20+ site-specific parsers
- **User Agent** (`src/tools/user_agent.ts`) - UA rotation pool
- **JS Detection** (`src/tools/js_detection.ts`) - SPA detection
- **Parallel Extraction** (`src/tools/parallel_extraction.ts`) - Batch processing
- **Rich Output** (`src/tools/rich_output.ts`) - CLI output with chalk + ora

#### Removed
- **All Python files** - `src/deepclaw/*.py` (70 files deleted)
- **Python tests** - `tests/*.py` (55 files deleted)
- **Web API (Python)** - `web/api/*.py` (deferred to future release)
- **Skill module (Python)** - `skill/*.py` (deferred to future release)
- **pyproject.toml** - No longer needed

#### Migration Stats
| Module | Files Created | Lines of Code |
|--------|:-------------:|:-------------:|
| LLM | 10 | 1,766 |
| Research | 9 | 2,036 |
| Tools | 12 | 3,795 |

#### Testing
- All 1039 tests passing
- 100% TypeScript coverage
- No Python dependencies remaining

## [3.2.0] - 2026-06-26

### 🎯 OpenClaw Model Integration

#### Added
- **OpenClaw Model Adapter** (`src/model/adapter.ts`)
  - HTTP REST wrapper for OpenClaw Gateway
  - OpenAI-compatible protocol (`/v1/chat/completions`)
  - Streaming support (`chatStream`)
  - Health check (`healthCheck`)
  - Timeout control (60s default)
  - Comprehensive error handling

- **Model Router** (`src/model/router.ts`)
  - Task-based routing: reasoning/analysis/coding/summarization/embedding/creative
  - Budget limit support
  - Cheapest model preference option
  - Integration with FallbackHandler & CostOptimizer

- **API Fallback** (`src/model/fallback.ts`)
  - Client-side fallback chain
  - Default fallback configs for 3 main models
  - Auto-retry on failure
  - Dynamic fallback rule addition

- **Cost Optimizer** (`src/model/cost.ts`)
  - Built-in cost table for all models
  - Budget control
  - Cheapest model recommendation by task type

- **Types** (`src/model/types.ts`)
  - ModelConfig, ChatMessage, ChatResponse, etc.
  - Default configurations

#### Changed
- **Research Module**: `src/research/index.ts` now uses OpenClawModelAdapter
  - Replaced legacy LLM implementation
  - Backward compatible API
  - Auto-fallback when Gateway unavailable

#### Removed
- **Legacy LLM**: `src/llm/index.ts` deleted
  - Duplicate code removed
  - Unified to `src/model/` module

#### Testing
- Test files: 5 (adapter, fallback, cost, router, index)
- Test cases: 62 (+37 from v3.1.0, +148% growth)
- Coverage: 98.84% statements, 92.15% branches, 100% functions

### Migration Guide
- No breaking changes
- All APIs remain backward compatible
- Internal implementation migrated to OpenClaw Gateway

## [3.0.3] - 2026-06-26

### 🚀 Performance Optimization

#### Added
- **SearchCoordinator** (`src/search/coordinator.ts`)
  - Concurrent search scheduling with priority + weight
  - Support for 50+ search sources via registration mechanism

- **BatchQueue** (`src/search/batch.ts`)
  - Time window (50ms) + count threshold batching
  - Reduce network round-trips

- **ConnectionPool** (`src/search/pool.ts`)
  - HTTP connection pooling with keep-alive
  - Undici Agent for Node 18+ (with fallback)
  - Retry on error with configurable max retries

- **SearchStream** (`src/search/stream.ts`)
  - Event-driven streaming results
  - First result < 500ms

- **PerformanceMetrics** (`src/search/metrics.ts`)
  - P50/P95/P99 sliding window
  - Search throughput statistics

#### Testing
- New test files: 5, 49 test cases
- All new modules ≥ 85% coverage

### Performance Goals
- P95 latency: < 3s (from ~10s)
- Concurrent sources: 50+
- First result streaming: < 500ms

## [3.0.2] - 2026-06-25

### Fixed
- **Cache Module Coverage**: Improved from 62.16% to 93.77%
  - Added `analytics.ts` - 100% coverage
  - Added `compression.ts` - 100% coverage
  - Added `distributed.ts` - 85.18% coverage
  - Added `invalidation.ts` - 97.45% coverage
  - Added `search-cache.ts` - 86.69% coverage
  - Added `warmer.ts` - 100% coverage
  - New test files: 7 tests, 95 test cases

### Added
- `src/types/optional-deps.d.ts` - Optional dependency type declarations
- Redis mock support via injectable `RedisFactory`

## [3.0.0-rc.4] - 2026-06-19

### Fixed
- OOM (JS heap out of memory) during test runs by adding `--max-old-space-size=4096`
  via vitest `poolOptions.forks.execArgv` and npm `test` script

## [3.0.0-rc.3] - 2026-06-17

### 🚀 RC: Stabilization + Performance

#### Added
- **Search Optimizer** (`src/search/optimizer.ts`)
  - Request deduplication: concurrent identical queries share a single promise
  - Batch search with configurable concurrency limits
  - URL normalization for improved deduplication (protocol/www/case-insensitive)
  - Query prediction for cache warming

#### Fixed
- **Plugin manifest**: `openclaw.plugin.json` version bumped to 3.0.0-rc.3 (4th-time fix)

#### Tests
- 11 summarization error hierarchy tests (100% passing)
- 14 search optimizer tests (100% passing)
- 25 new tests total

## [3.0.0-rc.2] - 2026-06-17

### 🚀 RC: Personalization + Style Adaptation

#### Added
- **Preference Learner** (`src/personalization/preference_learner.ts`)
  - Explicit preference setting and behavioral signal tracking
  - Adaptive depth adjustment (shallow/medium/deep) from research patterns
  - Style adaptation from user behavior signals

- **Style Adapter** (`src/personalization/style_adapter.ts`)
  - 4 research styles: academic, business, technical, quick
  - Style-specific tone (formality, technicality, conciseness)
  - Style-specific structure (abstract, executive summary, code examples, appendix)
  - Adaptive section titles and ordering per style

- **Topic Tracker** (`src/personalization/topic_tracker.ts`)
  - Interest weight tracking with time-based decay
  - Related topic boosting with built-in topic relation graph
  - Topic suggestion engine for unexplored areas
  - Diversity scoring and max-topic enforcement

- **PersonalizationEngine** (`src/personalization/index.ts`)
  - Unified entry point for preference learning + style + topics
  - Profile-synced section ordering and tone guidelines

## [3.0.0-rc.1] - 2026-06-17

### 🚀 RC: Continuous Learning + Self-Improvement

#### Added
- **Feedback Learner** (`src/learning/feedback_learner.ts`)
  - Explicit (ratings/comments) and implicit (actions) feedback processing
  - Topic preference learning with adaptive recommendations
  - Feedback pattern detection with trend analysis (improving/stable/declining)
  - Search depth and cross-domain recommendations based on learned preferences

- **Self Improver** (`src/learning/self_improver.ts`)
  - Performance self-assessment from research outcomes
  - Strategy adaptation: auto-adjusts search depth, max sources, cross-domain settings
  - Error pattern recognition across research stages with mitigation suggestions
  - Accuracy trend tracking over time

- **Knowledge Evolution** (`src/learning/knowledge_evolution.ts`)
  - Dynamic fact management with confidence-based filtering
  - Freshness tracking with per-day decay model
  - Fact versioning and update history
  - Stale/outdated fact identification and batch verification

- **DeepClawLearningEngine** (`src/learning/index.ts`)
  - Unified LearningEngine interface implementation
  - Coordinates feedback → strategy → knowledge pipeline
  - `getLearningMetrics()` for complete learning state

#### Fixed
- **IterativeVerifier**: Removed non-deterministic `Math.random()` in confidence update (flaky test fix)

### [3.0.0-beta.3] - 2026-06-17

### 🚀 Beta: Synthesis Engine

#### Added
- **Cross-Domain Synthesizer** (`src/synthesis/cross_domain_synthesizer.ts`)
  - CrossDomainSynthesizer: Identifies connections across knowledge domains
  - 4 connection types: analogy, causation, correlation, implication
  - Cross-cutting concept insight generation

- **Iterative Verifier** (`src/synthesis/iterative_verifier.ts`)
  - IterativeVerifier: Hypothesis → Test → Refine loop
  - Contradiction detection (English + Chinese patterns)
  - Confidence calibration with iteration-based learning

- **Discovery Engine** (`src/synthesis/discovery_engine.ts`)
  - DiscoveryEngine: Pattern recognition across domains
  - Research gap identification (7 research topic templates)
  - Novel pattern strength scoring

---

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
