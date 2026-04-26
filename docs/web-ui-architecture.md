# ResearchClaw Web UI - Technical Design

**Version**: 1.0.0
**Date**: 2026-04-26
**Status**: Draft

---

## 1. UI Architecture Overview

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ResearchClaw Web UI                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    React Application                         ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         ││
│  │  │   Search    │  │   Results   │  │   Report    │         ││
│  │  │    View     │  │    View     │  │    View     │         ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘         ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    API Layer (REST)                          ││
│  │              FastAPI / Flask Backend                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 ResearchClaw Core Engine                     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend Framework** | React | 18.x |
| **Build Tool** | Vite | 5.x |
| **UI Components** | Tailwind CSS + Headless UI | 3.x / 1.x |
| **State Management** | Zustand | 4.x |
| **Routing** | React Router | 6.x |
| **Markdown** | react-markdown + rehype | 9.x |
| **HTTP Client** | Axios | 1.x |
| **Icons** | Lucide React | 0.x |

---

## 2. Component Design

### 2.1 Page Structure

```
App
├── Layout
│   ├── Header (Logo, Navigation)
│   ├── Sidebar (optional)
│   └── Main Content
│
├── Pages
│   ├── SearchPage (/)
│   │   ├── SearchBar
│   │   ├── SearchEngineSelector
│   │   └── SearchParamsPanel
│   │
│   ├── ResultsPage (/results)
│   │   ├── ResultsList
│   │   ├── ResultItem
│   │   ├── Pagination
│   │   └── FilterPanel
│   │
│   └── ReportPage (/report/:id)
│       ├── MarkdownRenderer
│       ├── TableOfContents
│       └── ExportPanel
```

### 2.2 Core Components

| Component | Responsibility | Props |
|-----------|---------------|-------|
| **SearchBar** | Query input, submit | onSearch(query) |
| **SearchEngineSelector** | Choose search provider | engines[], selected, onChange |
| **SearchParamsPanel** | Configure search options | params, onChange |
| **ResultsList** | Display search results | results[], loading |
| **ResultItem** | Single result card | result, onSelect |
| **Pagination** | Page navigation | page, totalPages, onChange |
| **FilterPanel** | Filter results | filters, onChange |
| **MarkdownRenderer** | Render report markdown | content, onNavigate |
| **TableOfContents** | Report navigation | headings, activeId |
| **ExportPanel** | Export report | report, onExport |

---

## 3. API Design

### 3.1 Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/search` | Execute search |
| GET | `/api/results/:id` | Get search results |
| GET | `/api/reports` | List reports |
| GET | `/api/reports/:id` | Get report content |
| DELETE | `/api/reports/:id` | Delete report |

### 3.2 Data Models

```typescript
interface SearchRequest {
  query: string;
  engine: 'duckduckgo' | 'serpapi' | 'tavily';
  maxResults: number;
  includeMarkdown: boolean;
}

interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  publishedAt?: string;
  score: number;
}

interface Report {
  id: string;
  title: string;
  query: string;
  createdAt: string;
  content: string;
  sources: Source[];
}
```

---

## 4. State Management

### 4.1 Global Store (Zustand)

```typescript
interface ResearchStore {
  // Search State
  query: string;
  engine: SearchEngine;
  results: SearchResult[];
  isSearching: boolean;
  
  // Results State
  filters: FilterState;
  pagination: PaginationState;
  
  // Report State
  currentReport: Report | null;
  
  // Actions
  setQuery: (query: string) => void;
  setEngine: (engine: SearchEngine) => void;
  search: (query: string) => Promise<void>;
  setFilters: (filters: FilterState) => void;
  setPage: (page: number) => void;
}
```

---

## 5. File Structure

```
web/
└── ui/
    ├── public/
    │   └── favicon.ico
    ├── src/
    │   ├── components/
    │   │   ├── common/
    │   │   │   ├── Button.tsx
    │   │   │   ├── Input.tsx
    │   │   │   └── Card.tsx
    │   │   ├── search/
    │   │   │   ├── SearchBar.tsx
    │   │   │   ├── SearchEngineSelector.tsx
    │   │   │   └── SearchParamsPanel.tsx
    │   │   ├── results/
    │   │   │   ├── ResultsList.tsx
    │   │   │   ├── ResultItem.tsx
    │   │   │   ├── Pagination.tsx
    │   │   │   └── FilterPanel.tsx
    │   │   └── report/
    │   │       ├── MarkdownRenderer.tsx
    │   │       ├── TableOfContents.tsx
    │   │       └── ExportPanel.tsx
    │   ├── pages/
    │   │   ├── SearchPage.tsx
    │   │   ├── ResultsPage.tsx
    │   │   └── ReportPage.tsx
    │   ├── store/
    │   │   └── useResearchStore.ts
    │   ├── api/
    │   │   └── researchApi.ts
    │   ├── types/
    │   │   └── index.ts
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    └── tailwind.config.js
```

---

## 6. Acceptance Criteria

| Feature | Criteria |
|---------|----------|
| Search | Query input works, engine selection works |
| Results | Display results with pagination and filtering |
| Report | Markdown renders correctly with TOC navigation |
| Export | Can export report as PDF/Markdown |
| UI/UX | Responsive, accessible, performant |

---

**Document Status**: Draft
**Last Updated**: 2026-04-26
