---
name: researchclaw
description: Open-source Deep Research framework. Autonomously searches, extracts, and synthesizes information from the web.
homepage: https://github.com/liantian-cn/researchclaw
metadata: {"openclaw":{"emoji":"🦁","requires":{"bins":["python"],"env":["OPENCLAW_API_KEY"]},"primaryEnv":"OPENCLAW_API_KEY"}}
---

# ResearchClaw 🦁

Open-source Deep Research framework based on OpenClaw. An intelligent research assistant that autonomously searches, extracts, and synthesizes information from the web.

## Installation

```bash
# Install from GitHub
pip install git+https://github.com/liantian-cn/researchclaw.git

# Or install locally
cd researchclaw
pip install -e .
```

## OpenClaw Commands

### /research

Research a topic deeply and generate a comprehensive report.

```
/research <topic> [--depth=3] [--engine=duckduckgo] [--output=path] [--format=markdown]
```

Examples:
```
/research AI trends 2026
/research quantum computing --depth=5
/research machine learning --engine=bing --output=./report.md
```

### /search

Search for information on the web.

```
/search <query> [--limit=10] [--engine=duckduckgo]
```

Examples:
```
/search machine learning
/search neural networks --limit=20
```

### /llm

Chat with LLM providers.

```
/llm <prompt> [--provider=deepseek] [--model=...] [--temperature=0.7]
```

Examples:
```
/llm What is Python?
/llm Explain quantum computing --provider=glm
```

### /health

Check ResearchClaw skill health status.

### /help

Show available commands.

## Standalone Scripts

You can also use the standalone scripts:

```bash
python {baseDir}/scripts/research.py "artificial intelligence trends 2026"
python {baseDir}/scripts/search.py "machine learning"
python {baseDir}/scripts/llm.py "What is Python?"
```

## Options

- `--depth, -d`: Research depth level (default: 3)
- `--engine, -e`: Search engine to use (duckduckgo, bing)
- `--output, -o`: Output file path
- `--format, -f`: Output format (markdown, html, json)
- `--lang, -l`: Language (en, zh)

## Requirements

- Python 3.10+
- Optional: API keys for search engines (Bing) and LLM providers (DeepSeek, GLM, etc.)

## Environment Variables

- `DEEPSEEK_API_KEY`: DeepSeek API key
- `GLM_API_KEY`: GLM API key
- `MINIMAX_API_KEY`: MiniMax API key
- `KIMI_API_KEY`: Kimi API key
- `QWEN_API_KEY`: Qwen API key
- `BING_API_KEY`: Bing Search API key

Notes:
- Uses DuckDuckGo by default (no API key required)
- Supports multiple LLM providers for synthesis
- Generates comprehensive research reports in multiple formats
