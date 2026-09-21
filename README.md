# SciClaw

<div align="center">

**SciClaw — verifiable deep research for AI4S: research you can verify.**

*Open-source deep research framework · AI-Powered Autonomous Research Assistant*

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4%2B-3178c6.svg)](https://www.typescriptlang.org/)
[![Release](https://img.shields.io/badge/Release-v4.0.0--ga-blue.svg)](https://github.com/opensourceclaw/sciclaw/releases/tag/v4.0.0-ga)
[![Tests](https://img.shields.io/badge/Tests-959%20passed%20%2B%2026%20GA-brightgreen.svg)](#)

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

**SciClaw — verifiable deep research for AI4S: research you can verify.**

SciClaw serves AI4S (AI for Science) — an open-source deep research framework built on OpenClaw that autonomously searches, extracts, cross-validates, and synthesizes information from the web, with verifiable sources and traceable conclusions. It is an independent member of the agent family (alongside agents such as DevClaw in AI4SWE) — no direct dependency, shared ecosystem only.

The research capability evolves in stages through two flows, **DeepResearchFlow → AutoResearchFlow**, kept in one codebase (see [Roadmap](#-roadmap)).

### Core Features

| Feature | Description |
|---------|-------------|
| **DeepResearchFlow** | Staged research pipeline: plan → search → analyze → synthesize → report, with human-approval gates |
| **Real Web Search** | DuckDuckGo live retrieval wired into the mainline (mock mode available via `--mock`) |
| **Claim Verification** | Every claim passes a verifier; verdicts (support/refute/insufficient) ship with the report |
| **Evidence Gates** | Four enforced gates — source credibility, cross-validation, bias detection, citation integrity — fail-closed |
| **Evidence Block** | Reports embed the full evidence chain: resolved source URLs, per-claim citations, gate & verifier verdicts |
| **Benchmark Harness** | Reproducible scoring (factuality / completeness / citation / reasoning) with committed baseline reports |
| **GA Acceptance Suite** | Fixture + live end-to-end research tasks asserting the five-point evidence chain (`npm run test:ga`) |
| **REST API** | Express-based API server (experimental) |
| **Core Module** | Built-in search / extraction / validation / LLM engine (merged in v4.0.0) |

### Key Advantages

- ⚡ **Real, wired research**: live retrieval → claims → verifier → gates → report, runnable in one command
- 🚪 **Fail-closed gates**: quality checkpoints that block report conclusions, not decorate them
- 🔎 **Evidence you can inspect**: citations, verdicts and gate results embedded in every report
- 🧪 **Machine-checked claims**: an acceptance suite and benchmark baseline guard the "verifiable" property itself
- 🎯 **TypeScript**: full type safety, ESM, Node 22+

## 📦 Installation

### Prerequisites

- **Node.js**: 22.x (family dependencies require ≥ 22.22.3)
- **npm**: latest recommended
- The three sibling repos `claw-cog`, `claw-ctx`, `claw-mem` (declared as `file:` dependencies)

### Method 1: From Source (Recommended)

```bash
# Clone repository and its sibling dependencies
git clone https://github.com/opensourceclaw/sciclaw.git
git clone https://github.com/opensourceclaw/claw-cog.git
git clone https://github.com/opensourceclaw/claw-ctx.git
git clone https://github.com/opensourceclaw/claw-mem.git

# Sibling repos must sit next to the sciclaw checkout
cd sciclaw

# Install (siblings need install+build first — or use the CI recipe in .github/workflows/ci.yml)
(cd ../claw-cog && npm install && npm run build)
(cd ../claw-ctx && npm install && npm run build)
(cd ../claw-mem && npm install && npm run build)
npm install

# Build
npm run build
```

### Method 2: Via npm (Coming Soon)

```bash
npm install -g sciclaw
```

---

## 🚀 Quick Start

### CLI Usage

```bash
# Deep research on a topic (live web retrieval + evidence gates)
node dist/cli/index.js research "CRISPR base editing efficiency" --mode deep

# Autonomous mode (evolving)
node dist/cli/index.js research "research topic" --mode auto

# Synthetic demo without network
node dist/cli/index.js research "any topic" --mock

# Research pipeline management
node dist/cli/index.js pipeline --help

# Show version
node dist/cli/index.js --version   # 4.0.0
```

Example output (real run):

```
Found 15 results across 3 queries
Analysis: 29 claims, confidence 0.31
Synthesis (extractive): 5 insights
Report: 4 sections, 10 references
Evidence: 10 sources, 29 claims, 29 verifier verdicts
Gates: source-credibility:pass, cross-validation:pass, bias-detection:pass, citation-integrity:pass
```

### TypeScript API

SciClaw's public surface is re-exported from `src/index.ts` (`src/core` + research + knowledge + agents + benchmark + synthesis + orchestrator). Version constant:

```typescript
import { VERSION } from 'sciclaw'; // "4.0.0"
```

Programmatic research is available through the flow layer (see `src/flows/deep_research_flow.ts`) and the benchmark runner (`src/benchmark/run.ts`).

### REST API Server (experimental)

```bash
# Start API server
npm run serve

# Access API at http://localhost:3000
```

> The REST surface is **experimental** in v4.0.0-ga: it is not covered by the GA
> acceptance suite and its endpoints may change. The CLI is the supported entry point.

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
| `--mode` | string | `deep` | Research mode (deep/auto) |
| `--max-depth` | number | `5` | Maximum research depth |
| `--timeout` | number | `300` | Research timeout (seconds) |
| `--mock` | boolean | `false` | Synthetic data, no network (demos/tests) |

### Environment Variables

```bash
# Optional LLM configuration (provider used for synthesis; without a key the
# deterministic extractive path is used)
DEEPCLAW_LLM_PROVIDER=deepseek
DEEPCLAW_LLM_API_KEY=your-api-key

# Note: the DEEPCLAW_* namespace is a retained runtime contract from the
# project's DeepClaw era; migration to SCICLAW_* is planned for v4.1.

# Server configuration
PORT=3000
HOST=localhost
```

---

## 🔌 OpenClaw Plugin Integration

SciClaw ships with an OpenClaw plugin manifest.

### Plugin Configuration

The `openclaw.plugin.json` file defines:

- Plugin metadata (name, version, description)
- CLI commands (research, pipeline)
- API endpoints
- Default configuration

---

## 🏗️ Technical Architecture

```
┌─────────────────────────────────────────┐
│           SciClaw v4.0.0-ga            │
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

### Current Suite

```bash
npm test        # 959 passed | 4 skipped (76 files)
npm run test:ga # GA acceptance suite: 26/26 (fixture; CI-blocking)
npm run benchmark
```

Statement coverage: 54% overall — deliberately strongest on the evidence-critical
modules (`gate/`, `core/validation`, benchmark) with the GA suite asserting the
end-to-end evidence chain; per-module numbers in `coverage/`.

## 🗺️ Roadmap

SciClaw's staged evolution runs through two research flows over a shared architecture:

| Stage | Flow | Status | Focus |
|-------|------|--------|-------|
| 1 | **DeepResearchFlow** | ✅ Current | Deep retrieval and synthesis — multi-engine search, quality gates, verifiable reports (evidence-chain verified by the GA acceptance suite) |
| 2 | **AutoResearchFlow** | 🔄 Evolving | Autonomous research loops — hypothesis generation, experiment design and execution, iterative self-verification |

Both flows live in one codebase (unified in v3.8); AutoResearchFlow is the direction that makes SciClaw a true AI4S research partner, closing the loop from question to verified knowledge.

> **On "verifiable"**: the claim is backed by the GA acceptance suite (fixture + live runs asserting source provenance, citation coverage, gate enforcement and verifier verdicts — see `npm run test:ga` and `benchmark-results.json`). Known calibration limits are tracked honestly: two bias factors (confirmation/temporal) are currently not measurable from available inputs and are excluded from gate verdicts until the v4.0.x corpus expansion lands.

---

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) and the [releases page](https://github.com/opensourceclaw/sciclaw/releases).
Current milestone: **v4.0.0-ga** — identity integration (DeepClaw → SciClaw), core merged in-repo, evidence-gated research line GA'd.

## 🔄 Comparison with Other Systems

| Feature | SciClaw | Perplexity | ChatGPT Search |
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
