# Research Synthesis Architecture

## Overview

This document describes the architecture for LLM-powered research synthesis in ResearchClaw.

## Components

### 1. Synthesis Engine (`synthesizer.py`)

The main synthesis logic that transforms raw research findings into structured reports.

**Key Classes:**
- `SynthesisRequest` - Input for synthesis (topic, findings, preferences)
- `SynthesisResult` - Output with synthesized sections
- `ResearchSynthesizer` - Main orchestrator

**Synthesis Pipeline:**
1. **Input Processing** - Parse and validate findings
2. **Theme Extraction** - Use LLM to identify key themes
3. **Content Synthesis** - Generate coherent content per theme
4. **Section Organization** - Order and structure sections
5. **Quality Assessment** - Evaluate confidence and completeness

### 2. Report Generator (`report_generator.py`)

Generates formatted reports in multiple formats.

**Output Formats:**
- Markdown (default)
- HTML (with styling)
- JSON (structured data)
- PDF (via markdown conversion)

### 3. Smart Sectioning (`smart_sectioning.py`)

Automatic chapter detection and theme recognition.

**Features:**
- Topic-based section detection
- Theme clustering using LLM
- Section ordering optimization
- Confidence scoring per section

### 4. Citation Manager (`citation.py`)

Handles source attribution and citations.

**Features:**
- Multiple citation styles (APA, MLA, Chicago, Markdown)
- Inline citations
- Reference list generation
- Source quality scoring

## Data Flow

```
Raw Findings → Preprocessing → LLM Theme Extraction
    → Content Synthesis → Smart Sectioning
    → Citation Attribution → Report Generation
    → Output (MD/HTML/JSON)
```

## Integration Points

- **LLM Engine**: Uses existing `researchclaw.llm` for AI processing
- **Content Extraction**: Uses existing `researchclaw.tools.content_extraction`
- **Storage**: Uses existing cache/storage mechanisms
