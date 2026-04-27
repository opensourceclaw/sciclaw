# ResearchClaw 🦁

Open-source Deep Research framework based on OpenClaw. An intelligent research assistant that autonomously searches, extracts, and synthesizes information from the web.

## Features

- 🔍 **Multi-Engine Search**: DuckDuckGo, Bing, Microsoft Search
- 🤖 **Multi-Provider LLM**: DeepSeek, GLM, MiniMax, Kimi, Qwen
- 📄 **Smart Content Extraction**: Multiple strategies for robust extraction
- ⚡ **Parallel Processing**: Fast concurrent content retrieval
- 🎯 **Source Validation**: Quality scoring and filtering
- 📊 **Rich Reports**: Markdown, HTML, JSON with citations
- 🖥️ **Beautiful CLI**: Progress bars, tables, and rich output
- 🌍 **Multi-Language Support**: English and Chinese (CLI + Web UI)
- 🌐 **REST API**: FastAPI-based API server with WebSocket support

## Installation

```bash
pip3 install researchclaw
```

## Quick Start

```bash
# Basic research
researchclaw "artificial intelligence trends 2026"

# With custom depth
researchclaw "quantum computing" --depth 5

# Use specific search engine
researchclaw "machine learning" --engine bing
```

### Multi-Language Support

```bash
# Use in English (default)
researchclaw "machine learning"

# Use in Chinese
researchclaw --lang zh research "机器学习"
```

### REST API Server

```bash
# Start API server
python3 -m web.api.main

# Or install and use
pip3 install researchclaw
researchclaw-api

# Access API docs at http://localhost:8000/docs
```

## LLM Integration

```bash
# Chat with LLM
researchclaw llm "What is Python?"

# Use specific provider
researchclaw llm "Explain quantum computing" --provider glm

# Use specific model
researchclaw llm "Write a function" --model deepseek-coder --temperature 0.3
```

### Supported LLM Providers

| Provider | Default Model | Environment Variable |
|----------|---------------|---------------------|
| DeepSeek | deepseek-chat | `DEEPSEEK_API_KEY` |
| GLM | glm-4 | `GLM_API_KEY` |
| MiniMax | abab6.5s-chat | `MINIMAX_API_KEY` |
| Kimi | moonshot-v1-8k-chat | `KIMI_API_KEY` |
| Qwen | qwen-turbo | `DASHSCOPE_API_KEY` |

## Configuration

```bash
# Initialize config
researchclaw init

# Edit config.json to add API keys
```

## Supported Sites

ResearchClaw supports 24+ site-specific parsers including:

- **GitHub** - README, issues, PRs
- **Medium** - Articles
- **Hacker News** - Posts
- **Reddit** - Posts and comments
- **YouTube** - Video metadata
- **Twitter/X** - Tweets
- **Wikipedia** - Articles
- **Zhihu** - Questions and answers
- **V2EX** - Posts
- **掘金 (Juejin)** - Articles
- **Substack** - Newsletter articles
- **Hashnode** - Blog posts
- And more...

## Development

```bash
# Clone and install
git clone https://github.com/liantian-cn/researchclaw.git
cd researchclaw
pip install -e ".[dev]"

# Run tests
pytest

# Run CLI
python -m researchclaw.cli.main research "your topic"
```

## Architecture

- **LLM Providers**: Pluggable LLM adapters (DeepSeek, GLM, MiniMax, Kimi, Qwen)
- **Search Providers**: Pluggable search engine adapters
- **Content Extraction**: Multi-strategy content extraction with site-specific parsers
- **Report Synthesis**: AI-powered research synthesis
- **Storage**: Project-based research management

## License

Apache License 2.0 - See [LICENSE](LICENSE) for details.
