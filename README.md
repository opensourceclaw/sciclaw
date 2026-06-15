# DeepClaw

<div align="center">

**Open-source Deep Research Framework**

*AI-Powered Autonomous Research Assistant*

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4%2B-3178c6.svg)](https://www.typescriptlang.org/)
[![Version](https://img.shields.io/badge/Version-2.0.0--rc.3-orange.svg)](https://github.com/opensourceclaw/deepclaw)

</div>

---

## 🌟 Vision

**Make AI a research partner for everyone, breaking cognitive boundaries**

Enable everyone to access research capabilities comparable to professional researchers, lowering the barriers to deep research.

## 🎯 Mission

**Provide an open-source, trustworthy, continuously evolving deep research framework**

- Open: Code transparency, community-driven
- Trustworthy: Verifiable sources, traceable conclusions
- Evolving: Learn from feedback, continuously improve

## 💎 Values

| Value | Description |
|-------|-------------|
| **Trustworthy** | Verifiable sources, traceable conclusions |
| **Open** | Open-source transparency, community co-building |
| **Evolving** | Learn from feedback, continuously improve |
| **Empowering** | Make humans stronger, not replace them |

---

## 🎯 Product Positioning

DeepClaw is an **open-source deep research framework** based on OpenClaw. It is an intelligent research assistant that autonomously searches, extracts, and synthesizes information from the web.

### Core Features

| Feature | Description |
|---------|-------------|
| Multi-Engine Search | DuckDuckGo, Google, Bing |
| Smart Content Extraction | Cheerio-based robust extraction |
| Parallel Processing | Fast concurrent content retrieval |
| Source Deduplication | URL and title-based deduplication |
| Rich Reports | Markdown, HTML formats with citations |
| REST API | Express-based API server |

### Key Advantages

- ⚡ **Fast Research**: Parallel processing with async support
- 🎯 **TypeScript**: Full type safety and modern tooling
- 🌍 **Multi-Language**: English and Chinese support
- 🌐 **REST API**: Express-based API server

---

## 📦 Installation

### Prerequisites

- **Node.js**: 18.0 or higher
- **npm**: Latest version recommended

```bash
# Check Node.js version
node --version
```

### Method 1: From Source (Recommended)

```bash
# Clone repository
git clone https://github.com/opensourceclaw/deepclaw.git
cd deepclaw

# Install dependencies
npm install

# Build
npm run build
```

### Method 2: Via npm (Coming Soon)

```bash
npm install -g deepclaw
```

---

## 🚀 Quick Start

### CLI Usage

```bash
# Basic search
node dist/cli/index.js search "artificial intelligence trends 2026"

# Deep research on a topic
node dist/cli/index.js research "quantum computing" --depth deep

# Generate report
node dist/cli/index.js report <report-id>

# Start API server
node dist/cli/index.js serve
```

### TypeScript API

```typescript
import { search, conductResearch, generateReport } from 'deepclaw';

// Search
const results = await search({ query: 'AI trends 2026', maxResults: 20 });

// Research
const research = await conductResearch({
  topic: 'quantum computing',
  depth: 'deep',
});

// Generate report
const report = await generateReport(research.id, { format: 'markdown' });
```

### REST API Server

```bash
# Start API server
npm run serve

# Access API at http://localhost:3000
```

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/search | Search across sources |
| POST | /api/research | Deep research on topic |
| GET | /api/report/:id | Get report by ID |
| POST | /api/report/:id | Generate report |
| GET | /api/status | Server status |

---

## 🛠️ Configuration Options

### CLI Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `--depth` | string | `medium` | Research depth (shallow/medium/deep) |
| `--engine` | string | `duckduckgo` | Search engine |
| `--format` | string | `markdown` | Output format |
| `--output` | string | - | Output file path |
| `--max-results` | number | `20` | Maximum results |

### Environment Variables

```bash
# Optional LLM configuration
DEEPCLAW_LLM_PROVIDER=deepseek
DEEEPCLAW_LLM_API_KEY=your-api-key

# Server configuration
PORT=3000
HOST=localhost
```

---

## 🔌 OpenClaw Plugin Integration

DeepClaw v2.0.0+ is designed as an OpenClaw plugin.

### Plugin Configuration

The `openclaw.plugin.json` file defines:

- Plugin metadata (name, version, description)
- CLI commands (search, research, report, serve)
- API endpoints
- Default configuration

---

## 🏗️ Technical Architecture

```
┌─────────────────────────────────────────┐
│           DeepClaw v2.0.0               │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │     CLI (Commander)             │   │  ← Command Line Interface
│  │   search/research/report/serve  │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │     API (Express)               │   │  ← REST API Server
│  │   /api/search /api/research     │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │     Search Engine               │   │  ← Multi-Engine Search
│  │   DuckDuckGo / Google / Bing    │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │   Content Extractor             │   │  ← Cheerio + Turndown
│  │   HTML → Markdown               │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │     LLM Engine                  │   │  ← Multi-Provider LLM
│  │   Synthesis & Summarization     │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │     Report Generator            │   │  ← Multi-Format Output
│  │   Markdown / HTML               │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 🧪 Testing

### Run Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

### Current Coverage

| Module | Coverage |
|--------|----------|
| Overall | **71.53%** |
| search | 74.28% |
| research | 96.92% |
| report | 100% |
| extractor | 96.29% |
| dedup | 96% |
| tools | 91.13% |
| llm | 75.6% |

---

## 📝 Changelog

### v2.0.0-beta.1 (2026-06-14)

- ✅ **TypeScript Migration**: Complete Python → TypeScript migration
- ✅ **New Architecture**: Express API, Commander CLI
- ✅ **Dependencies**: axios, cheerio, zod, turndown
- ✅ **Test Coverage**: 71.53% with vitest
- ✅ **OpenClaw Plugin**: Standard plugin configuration

### v1.0.0 (2026-05-07)

- ✅ Python-based research framework
- ✅ Multi-engine search
- ✅ Multi-provider LLM
- ✅ Source validation

---

## 🔄 Comparison with Other Systems

| Feature | DeepClaw | Perplexity | ChatGPT Search |
|---------|----------|------------|----------------|
| Open Source | ✅ | ❌ | ❌ |
| Local Deployment | ✅ | ❌ | ❌ |
| Multi-Engine | ✅ | ❌ | ❌ |
| TypeScript | ✅ | ❌ | ❌ |
| REST API | ✅ | ❌ | ❌ |

---

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

---

## 📄 License

Apache License 2.0 - See [LICENSE](LICENSE)

---

## 🙏 Acknowledgments

- [OpenClaw](https://github.com/openclaw/openclaw) - AI Assistant Framework
- [Cheerio](https://cheerio.js.org/) - HTML Parsing
- [DuckDuckGo](https://duckduckgo.com/) - Search Engine

---

<div align="center">

**Made with ❤️ by the OpenClaw Community**

</div>
