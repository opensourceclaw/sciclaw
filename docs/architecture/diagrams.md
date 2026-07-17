# DeepClaw Architecture Diagrams

Visual representation of DeepClaw v3.5.0 architecture using Mermaid diagrams.

## Pipeline Flow

The research pipeline follows a 5-stage flow:

```mermaid
graph LR
    A[PLAN] --> B[SEARCH]
    B --> C[SYNTHESIZE]
    C --> D[WRITE]
    D --> E[VERIFY]
    
    style A fill:#e1f5fe
    style B fill:#fff3e0
    style C fill:#e8f5e9
    style D fill:#fce4ec
    style E fill:#f3e5f5
```

### Stage Descriptions

| Stage | Purpose | Output |
|-------|---------|--------|
| PLAN | Decompose query into sub-queries | Research plan |
| SEARCH | Execute searches on multiple engines | Raw results |
| SYNTHESIZE | Combine and analyze findings | Synthesized content |
| WRITE | Generate structured report | Markdown/HTML/PDF |
| VERIFY | Quality check and validation | Verification result |

## Gate System

The Gate system enforces quality checkpoints:

```mermaid
graph TD
    OR[Orchestrator] --> GR[GateRegistry]
    GR --> IVG[InternalVerifyGate]
    IVG --> |passed| CONTINUE[Continue Pipeline]
    IVG --> |failed| BLOCK[Block Pipeline]
    
    subgraph "Validation Rules"
        R1[type_check_failed]
        R2[build_failed]
        R3[tests_failed]
        R4[incomplete_tests]
        R5[regression_failed]
        R6[config_error]
        R7[chinese_chars - warning]
        R8[hardcoded_paths - warning]
        R9[missing_headers - warning]
    end
    
    style IVG fill:#ffecb3
    style BLOCK fill:#ffcdd2
    style CONTINUE fill:#c8e6c9
```

## Monitoring Flow

Observer collects metrics throughout the pipeline:

```mermaid
graph LR
    subgraph "Hooks"
        H1[onResearchStart]
        H2[onPhaseEnd]
        H3[onAgentEnd]
        H4[onSearchResult]
        H5[onResearchEnd]
    end
    
    H1 --> O[DeepClawObserver]
    H2 --> O
    H3 --> O
    H4 --> O
    H5 --> O
    
    O --> MC[MetricsCollector]
    O --> AM[AlertManager]
    
    MC --> |persist| FS[Filesystem]
    AM --> |emit| ALERTS[Alert Events]
    
    style O fill:#bbdefb
    style MC fill:#c8e6c9
    style AM fill:#ffccbc
```

### Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `researchDurationMs` | Counter | Total pipeline time |
| `phaseDurationMs` | Gauge | Time per phase |
| `agentResponseTimeMs` | Gauge | Per-agent timing |
| `cacheHitRate` | Gauge | Cache efficiency |
| `errorRate` | Gauge | Failure ratio |
| `sourceCount` | Counter | Sources found |
| `tokenUsage` | Counter | Tokens consumed |

### Alert Rules

| Rule | Threshold | Severity |
|------|:---------:|:--------:|
| high_error_rate | > 30% | warning |
| slow_response | > 120s | warning |
| low_cache_hit | < 20% | info |
| token_budget_exceeded | > 100k | critical |
| zero_sources | = 0 | critical |

## Approval Flow

Human-in-the-Loop approval state machine:

```mermaid
stateDiagram-v2
    [*] --> pending
    pending --> awaiting_approval: request
    awaiting_approval --> approved: approve
    awaiting_approval --> rejected: reject
    awaiting_approval --> auto_approved: timeout (research_plan)
    awaiting_approval --> auto_rejected: timeout (budget/source)
    
    approved --> [*]
    rejected --> [*]
    auto_approved --> [*]
    auto_rejected --> [*]
```

### Approval Points

| Point | When | Timeout Behavior |
|-------|------|------------------|
| research_plan | Before pipeline execution | Auto-approve |
| budget_threshold | Token estimate > budget | Auto-reject |
| source_quality | Low-quality sources | Auto-reject |

## Module Dependencies

```mermaid
graph TD
    CLI[cli/pipeline] --> PC[PipelineCoordinator]
    CLI --> GATE[gate]
    
    ORCH[agents/orchestrator] --> OBS[monitoring/Observer]
    ORCH --> APPR[approval/ApprovalGate]
    
    GATE --> REG[GateRegistry]
    APPR --> GATE
    
    OBS --> MET[MetricsCollector]
    OBS --> ALERT[AlertManager]
    
    TRIG[trigger/TriggerManager] --> PC
    
    LLM[llm/ProviderRegistry] --> PROV[llm/providers]
    
    style CLI fill:#e1f5fe
    style GATE fill:#fff3e0
    style OBS fill:#e8f5e9
    style APPR fill:#fce4ec
    style TRIG fill:#f3e5f5
```

## Multi-Agent Architecture

```mermaid
graph TB
    subgraph "Agents"
        PA[PlanningAgent]
        SA[SearchAgent]
        SYA[SynthesisAgent]
        WA[WritingAgent]
    end
    
    ORC[Orchestrator] --> PA
    ORC --> SA
    ORC --> SYA
    ORC --> WA
    
    PA --> |sub-queries| SA
    SA --> |raw results| SYA
    SYA --> |synthesis| WA
    WA --> |report| OUT[Output]
    
    style ORC fill:#bbdefb
    style PA fill:#c8e6c9
    style SA fill:#ffccbc
    style SYA fill:#f8bbd9
    style WA fill:#d1c4e9
```

## LLM Provider Registry

```mermaid
graph LR
    subgraph "Providers"
        DS[DeepSeek]
        QW[Qwen]
        KM[Kimi]
        GL[GLM]
        MX[MiniMax]
    end
    
    PR[ProviderRegistry] --> DS
    PR --> QW
    PR --> KM
    PR --> GL
    PR --> MX
    
    REQ[Request] --> PR
    PR --> |fallback| RES[Response]
    
    style PR fill:#bbdefb
```

### Provider Capabilities

| Provider | Chat | Streaming | Embeddings | Function Calling |
|----------|:----:|:---------:|:----------:|:----------------:|
| DeepSeek | ✅ | ✅ | ✅ | ✅ |
| Qwen | ✅ | ✅ | ✅ | ✅ |
| Kimi | ✅ | ✅ | ❌ | ❌ |
| GLM | ✅ | ✅ | ✅ | ❌ |
| MiniMax | ✅ | ✅ | ✅ | ❌ |

---

*DeepClaw v3.5.0 Architecture Diagrams*
