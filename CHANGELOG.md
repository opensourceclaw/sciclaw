# Changelog

All notable changes to ResearchClaw will be documented in this file.

## [0.4.0] - 2026-04-26

### Added
- **Web UI**: New React-based web interface
  - SearchPage, ResultsPage, ReportPage
  - Beautiful responsive design with Tailwind CSS
- **i18n Support**: Multi-language web interface
  - English (en) and Chinese (zh) support
  - Language switcher with localStorage persistence
  - Browser language detection

### Improved
- **Test Coverage**: 533+ tests with 100% pass rate
- **Build Performance**: Optimized production builds
- **UI/UX**: Enhanced user experience with loading states and animations

### Fixed
- TypeScript compilation errors in web UI
- Component import paths
- i18n integration with React components

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
