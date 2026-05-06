# DeepClaw

<div align="center">

**Open-source Deep Research Framework**

*AI-Powered Autonomous Research Assistant*

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Python](https://img.shields.io/badge/Python-3.10%2B-brightgreen.svg)](https://www.python.org/)
[![Version](https://img.shields.io/badge/Version-0.6.0-blue.svg)](https://github.com/opensourceclaw/deepclaw)

</div>

---

## 🌟 Vision

**让 AI 成为每个人的研究伙伴，突破认知边界**

让每个人都能获得接近专业研究员的信息能力，降低深度研究的门槛。

## 🎯 Mission

**提供开源、可信、持续进化的深度研究框架**

- 开源：代码透明、社区驱动
- 可信：源可验证、结论可追溯
- 进化：从反馈中学习、持续改进

## 💎 Values

| Value | Description |
|-------|-------------|
| **可信 (Trustworthy)** | 源可验证，结论可追溯 |
| **开放 (Open)** | 开源透明，社区共建 |
| **进化 (Evolving)** | 从反馈中学习，持续改进 |
| **赋能 (Empowering)** | 让人更强，而非替代人 |

---

## 🎯 Product Positioning

DeepClaw is an **open-source deep research framework** based on OpenClaw. It is an intelligent research assistant that autonomously searches, extracts, and synthesizes information from the web.

### Core Features

| Feature | Description |
|---------|-------------|
| Multi-Engine Search | DuckDuckGo, Bing, Microsoft Search |
| Multi-Provider LLM | DeepSeek, GLM, MiniMax, Kimi, Qwen |
| Smart Content Extraction | Multiple strategies for robust extraction |
| Parallel Processing | Fast concurrent content retrieval |
| Source Validation | Quality scoring and filtering |
| Rich Reports | Markdown, HTML, JSON with citations |

### Key Advantages

- ⚡ **Fast Research**: Parallel processing with async support
- 🎯 **Source Validation**: Quality scoring and credibility assessment
- 🌍 **Multi-Language**: English and Chinese support (CLI + Web UI)
- 🌐 **REST API**: FastAPI-based API server with WebSocket support

---

## 📦 Installation

### Prerequisites

- **Python**: 3.10 or higher
- **pip**: Latest version recommended

```bash
# Check Python version
python3 --version
```

### Method 1: Via ClawHub (Recommended - Skill)

```bash
# Install ClawHub if not installed
npm install -g clawhub

# Install DeepClaw as OpenClaw Skill
npx clawhub@latest install opensourceclaw-deepclaw
```

### Method 2: From Source

```bash
# Clone repository
git clone https://github.com/opensourceclaw/deepclaw.git
cd deepclaw

# Install in development mode (recommended)
pip3 install -e .

# Or install all dependencies
pip3 install -e ".[all]"
```

### Method 3: Via pip (GitHub)

```bash
# Install latest version from GitHub (requires git)
pip3 install git+https://github.com/opensourceclaw/deepclaw.git

# Or install specific version
pip3 install git+https://github.com/opensourceclaw/deepclaw.git@v0.5.0
```

---

## 🚀 Quick Start

### CLI Usage

```bash
# Basic research
deepclaw "artificial intelligence trends 2026"

# With custom depth
deepclaw "quantum computing" --depth 5

# Use specific search engine
deepclaw "machine learning" --engine bing

# Use in Chinese
deepclaw --lang zh research "机器学习"
```

### Python API

```python
from deepclaw.research.runner import ResearchRunner

# Initialize research runner
runner = ResearchRunner()

# Run research
report = runner.run("AI trends 2026", depth=3)

# Get results
print(report.format_markdown())
print(f"Sources: {len(report.sources)}")
```

### REST API Server

```bash
# Start API server
python3 -m web.api.main

# Or use CLI
deepclaw-api

# Access API docs at http://localhost:8000/docs
```

---

## 🛠️ Configuration Options

### CLI Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `--depth` | int | `3` | Research depth (1-10) |
| `--engine` | str | `duckduckgo` | Search engine |
| `--lang` | str | `en` | Language (en/zh) |
| `--format` | str | `markdown` | Output format |
| `--output` | str | - | Output file path |

### LLM Providers

| Provider | Default Model | Environment Variable |
|----------|---------------|---------------------|
| DeepSeek | deepseek-chat | `DEEPSEEK_API_KEY` |
| GLM | glm-4 | `GLM_API_KEY` |
| MiniMax | abab6.5s-chat | `MINIMAX_API_KEY` |
| Kimi | moonshot-v1-8k-chat | `KIMI_API_KEY` |
| Qwen | qwen-turbo | `DASHSCOPE_API_KEY` |

---

## 🔌 OpenClaw Skill Installation

DeepClaw can be used as an OpenClaw Skill for deep research integration.

### Prerequisites

- **OpenClaw**: 0.9.0 or higher
- **Python**: 3.10+

```bash
# Install DeepClaw first
pip3 install -e .

# Install via ClawHub
npx clawhub@latest install opensourceclaw-deepclaw
```

### Usage as Skill

```
/research "AI agents in 2026"
/research "quantum computing applications" --depth=deep --sources=20
/research --interactive
```

---

## 🏗️ Technical Architecture

```
┌─────────────────────────────────────────┐
│           DeepClaw                      │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │     Research Runner             │   │  ← Main Orchestrator
│  │   Task Planning + Execution     │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │     Search Engine               │   │  ← Multi-Engine Search
│  │   DuckDuckGo / Bing / Tavily    │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │   Content Extractor             │   │  ← Smart Extraction
│  │   Site-Specific Parsers         │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │     LLM Engine                  │   │  ← Multi-Provider LLM
│  │   DeepSeek/GLM/Qwen/Kimi        │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │     Report Generator            │   │  ← Multi-Format Output
│  │   Markdown / HTML / PDF         │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 🔧 Advanced Features

### 1. Multi-Engine Search

```python
from deepclaw.research.search import SearchEngine

# Use specific provider
engine = SearchEngine(provider="bing")
results = engine.search("AI trends", limit=10)

# Or use all providers
engine = SearchEngine(provider="all")
results = engine.search("quantum computing", limit=20)
```

### 2. Source Validation

```python
from deepclaw.tools.source_validation import SourceValidator

validator = SourceValidator()

# Validate sources
for url in sources:
    score = validator.validate(url)
    print(f"{url}: {score}")
```

### 3. Site-Specific Extraction

```python
from deepclaw.tools.site_specific import SiteExtractor

extractor = SiteExtractor()

# Extract from GitHub
github_data = extractor.extract(
    url="https://github.com/opensourceclaw/deepclaw",
    site_type="github"
)

# Extract from Medium
medium_data = extractor.extract(
    url="https://medium.com/ai-research",
    site_type="medium"
)
```

### 4. Multi-Format Report

```python
from deepclaw.research.synthesizer import ReportSynthesizer

synthesizer = ReportSynthesizer()

# Generate Markdown report
markdown_report = synthesizer.generate(
    topic="AI trends",
    sections=data,
    format="markdown"
)

# Generate HTML report
html_report = synthesizer.generate(
    topic="AI trends",
    sections=data,
    format="html"
)
```

---

## 📊 Supported Sites

DeepClaw supports 24+ site-specific parsers:

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

---

## 📝 Changelog

### v0.5.0 (2026-05-01)

- ✅ **Renamed**: ResearchClaw → DeepClaw
- ✅ **Plugin Architecture**: Improved OpenClaw Skill integration
- ✅ **Enhanced CLI**: Rich progress bars and tables

### v0.4.0 (2026-04-27)

- ✅ **Multi-Provider LLM**: Added GLM, MiniMax, Kimi, Qwen support
- ✅ **Web UI**: Beautiful web interface for research

### v0.3.0 (2026-04-20)

- ✅ **Source Validation**: Quality scoring and filtering
- ✅ **Parallel Processing**: Fast concurrent retrieval

### v0.2.0 (2026-04-15)

- ✅ **REST API**: FastAPI-based API server
- ✅ **Multi-Language**: English and Chinese support

### v0.1.0 (2026-04-10)

- ✅ Initial release
- ✅ Basic search and extraction

---

## 🔄 Comparison with Other Systems

| Feature | DeepClaw | Perplexity | ChatGPT Search | You.com |
|---------|----------|------------|----------------|---------|
| Open Source | ✅ | ❌ | ❌ | Partial |
| Local Deployment | ✅ | ❌ | ❌ | ❌ |
| Multi-Engine | ✅ | ❌ | ❌ | ✅ |
| Multi-Provider LLM | ✅ | ❌ | ❌ | ❌ |
| Custom Parsers | ✅ | ❌ | ❌ | Partial |
| REST API | ✅ | ❌ | ❌ | ✅ |
| Multi-Language | ✅ | ✅ | ✅ | ✅ |

### System Overview

| System | Positioning | Core Features |
|--------|-------------|---------------|
| **DeepClaw** | Open-Source Research Framework | Multi-Engine + Multi-LLM + Local Deployment |
| **Perplexity** | AI-Powered Search Engine | Real-time web access + citations |
| **ChatGPT Search** | Search-Enhanced Chat | Bing integration + conversational |
| **You.com** | Customizable Search | Personalization + AI summarization |

---

## 🧪 Testing

### Run Tests

```bash
# All tests
pytest tests/ -v

# Specific modules
pytest tests/test_search.py -v
pytest tests/test_llm_engine.py -v
pytest tests/test_content_extraction.py -v

# With coverage
pytest tests/ --cov=deepclaw --cov-report=html
```

### Install Test Dependencies

```bash
pip3 install -e ".[dev]"
```

---

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

---

## 📄 License

Apache License 2.0 - See [LICENSE](LICENSE)

---

## 🙏 Acknowledgments

- [OpenClaw](https://github.com/openclaw/openclaw) - AI Assistant Framework
- [BeautifulSoup](https://www.crummy.com/software/BeautifulSoup/) - HTML Parsing
- [DuckDuckGo](https://duckduckgo.com/) - Search Engine

---

<div align="center">

**Made with ❤️ by the OpenClaw Community**

</div>
