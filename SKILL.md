# ResearchClaw Skill Specification

## Overview

ResearchClaw is an OpenClaw Skill that provides deep research capabilities powered by AI. It enables users to conduct comprehensive research on any topic with source validation, smart synthesis, and structured reporting.

## Capability

### Core Features
- **Web Search**: Multi-engine search with DuckDuckGo, Tavily, and custom search providers
- **Content Extraction**: Extract and parse content from web pages, handling JavaScript-rendered sites
- **Source Validation**: Verify source credibility and relevance
- **Smart Synthesis**: AI-powered content synthesis using multiple LLM providers (OpenAI, Claude, DeepSeek, GLM, Qwen, Kimi, MiniMax)
- **Report Generation**: Generate structured research reports in multiple formats (Markdown, HTML, PDF)

### Use Cases
- Academic research
- Market research
- Competitive analysis
- Topic deep-dives
- Fact-checking

## Usage

### Commands
- `/research <topic>` - Start a research task on the given topic
- `/research --interactive` - Start an interactive research session
- `/research --status` - Check current research status
- `/research --report <id>` - Retrieve a previously generated report

### Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| topic | string | Research topic or question |
| depth | string | Research depth: quick/standard/deep |
| sources | number | Maximum number of sources to analyze (default: 10) |
| format | string | Output format: markdown/html/pdf |
| language | string | Report language |

### Examples
```
/research "AI agents in 2026"
/research "quantum computing applications" --depth=deep --sources=20
/research --interactive
```

## Architecture

### Components
- **ResearchEngine**: Core research orchestration
- **SearchProvider**: Multi-engine search abstraction
- **ContentExtractor**: Web content extraction
- **LLMEngine**: Multi-provider LLM integration
- **ReportGenerator**: Multi-format report generation

### Configuration
- Search engine preferences
- LLM provider settings (API keys, endpoints)
- Output preferences
- Cache settings

## Requirements

- Python 3.10+
- OpenClaw 0.9.0+
- API keys for search/LLM providers (configurable)

## License

Apache-2.0
