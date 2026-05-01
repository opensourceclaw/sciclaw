---
name: deepclaw
description: OpenClaw Deep Research Skill - AI-powered autonomous research assistant with multi-source search, content extraction, and intelligent synthesis.
metadata: {"clawdbot":{"emoji":"🦁","requires":{"bins":["python3"]},"primaryEnv":"DEEPCLAW_ENABLED"}}
---

# DeepClaw - OpenClaw Deep Research Skill

**AI-Powered Autonomous Research Assistant**

---

## 🚀 Quick Start

### Installation

```bash
# Via ClawHub (recommended)
npx clawhub@latest install opensourceclaw-deepclaw

# Or from source
git clone https://github.com/opensourceclaw/deepclaw.git ~/.openclaw/workspace/skills/deepclaw
cd ~/.openclaw/workspace/skills/deepclaw
pip3 install -e .
```

### Enable

Add to `~/.openclaw/config.json`:

```json
{
  "skills": {
    "deepclaw": {
      "enabled": true
    }
  }
}
```

### Usage

```
/research "AI agents in 2026"
/research "quantum computing applications" --depth=deep --sources=20
/research --interactive
```

---

## 🎯 Core Features

### 1. Multi-Engine Search

| Engine | Description |
|--------|-------------|
| DuckDuckGo | Default search engine |
| Bing | Microsoft Search API |
| Tavily | AI-optimized search |

### 2. Multi-Provider LLM

| Provider | Default Model | Environment Variable |
|----------|---------------|---------------------|
| DeepSeek | deepseek-chat | `DEEPSEEK_API_KEY` |
| GLM | glm-4 | `GLM_API_KEY` |
| MiniMax | abab6.5s-chat | `MINIMAX_API_KEY` |
| Kimi | moonshot-v1-8k-chat | `KIMI_API_KEY` |
| Qwen | qwen-turbo | `DASHSCOPE_API_KEY` |

### 3. Smart Content Extraction

- Site-specific parsers (24+ sites)
- JavaScript-rendered content handling
- Multi-strategy extraction fallback

### 4. Source Validation

- Quality scoring
- Credibility assessment
- Relevance filtering

---

## 📁 Research Output

DeepClaw generates structured research reports:

```
~/.openclaw/workspace/
└── research/
    └── {timestamp}_{topic}/
        ├── report.md          # Markdown report
        ├── report.html        # HTML report
        └── sources/           # Raw source data
```

---

## 🛠️ Configuration (Optional)

### CLI Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `--depth` | int | `3` | Research depth (1-10) |
| `--engine` | str | `duckduckgo` | Search engine |
| `--lang` | str | `en` | Language (en/zh) |
| `--format` | str | `markdown` | Output format |
| `--output` | str | - | Output file path |

### Skill Configuration

```json
{
  "deepclaw": {
    "search": {
      "default_engine": "duckduckgo",
      "max_results": 10
    },
    "llm": {
      "default_provider": "deepseek",
      "default_temperature": 0.7
    },
    "output": {
      "default_format": "markdown",
      "workspace": "~/.openclaw/workspace/research"
    }
  }
}
```

---

## 🔧 API

### Python API

```python
from deepclaw.research.runner import ResearchRunner
from deepclaw.research.search import SearchEngine
from deepclaw.llm.engine import LLMEngine

# Research API
runner = ResearchRunner()
report = runner.run("AI trends 2026", depth=3)
print(report.format_markdown())

# Search API
engine = SearchEngine(provider="bing")
results = engine.search("quantum computing", limit=10)

# LLM API
llm = LLMEngine(provider="deepseek", model="deepseek-chat")
response = llm.chat([{"role": "user", "content": "What is Python?"}])
```

### OpenClaw Skill API

```
/research <topic> [options]
```

---

## 📊 Supported Sites

DeepClaw supports 24+ site-specific parsers:

- GitHub, GitLab, Gitee
- Medium, Substack, Hashnode
- Hacker News, Reddit
- YouTube, Twitter/X
- Wikipedia, Zhihu, V2EX
- 掘金 (Juejin), 知乎

---

## 📄 License

Apache License 2.0

---

## 🙏 Acknowledgments

- OpenClaw Community
- BeautifulSoup Contributors
- All LLM Providers

---

**AI-Powered Deep Research** 🦁
