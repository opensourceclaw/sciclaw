# ResearchClaw 🦁

Open-source Deep Research framework based on OpenClaw. An intelligent research assistant that autonomously searches, extracts, and synthesizes information from the web.

## Features

- 🔍 **Multi-Engine Search**: DuckDuckGo, Bing, Microsoft Search
- 📄 **Smart Content Extraction**: Multiple strategies for robust extraction
- ⚡ **Parallel Processing**: Fast concurrent content retrieval
- 🎯 **Source Validation**: Quality scoring and filtering
- 📊 **Rich Reports**: Markdown, HTML, JSON with citations
- 🖥️ **Beautiful CLI**: Progress bars, tables, and rich output

## Installation

```bash
pip install researchclaw
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

## Configuration

```bash
# Initialize config
researchclaw init

# Edit config.json to add API keys
```

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

- **Search Providers**: Pluggable search engine adapters
- **Content Extraction**: Multi-strategy content extraction
- **Report Synthesis**: AI-powered research synthesis
- **Storage**: Project-based research management

## License

Apache License 2.0 - See [LICENSE](LICENSE) for details.
