# DeepClaw v0.7.0 - Iteration Plan

**Version**: 1.0.0
**Date**: 2026-05-06
**Status**: Draft
**Goal**: Source Validation & Trustworthiness

---

## 1. Release Overview

| Item | Value |
|------|-------|
| **Version** | v0.7.0 |
| **Code Name** | Trust First |
| **Target Date** | 2-3 weeks from start |
| **Goal** | Build source validation and credibility assessment capabilities |

---

## 2. Scope

### 2.1 In Scope

| Feature | Description | Priority |
|---------|-------------|----------|
| Source Quality Scoring | Score sources based on credibility metrics | P0 |
| Citation Tracking | Track and attribute all sources used | P0 |
| Source Validation API | External source verification | P1 |
| Report Citations | Generate reports with proper citations | P0 |
| Source Transparency | Show source quality in results | P1 |

### 2.2 Out of Scope (v0.7.x)

- User feedback learning system (Phase 3)
- Advanced fact-checking AI
- Cloud deployment
- Mobile UI

---

## 3. Weekly Breakdown

### Week 1: Source Quality Scoring (Days 1-5)

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Design source scoring algorithm | Scoring model docs |
| 2 | Implement domain reputation scoring | Domain scoring module |
| 3 | Implement content freshness scoring | Date-based scoring |
| 4 | Implement author/authority scoring | Author credibility |
| 5 | Unit tests | Test coverage |

**Milestone**: Basic source scoring working

### Week 2: Citation System (Days 6-10)

| Day | Task | Deliverable |
|-----|------|-------------|
| 6 | Design citation data structure | Citation schema |
| 7 | Implement citation tracking | Track sources during research |
| 8 | Implement report citation injection | Add citations to reports |
| 9 | Implement citation format options | APA, MLA, Chicago styles |
| 10 | Integration tests | E2E tests |

**Milestone**: Citation system working

### Week 3: Validation & Polish (Days 11-15)

| Day | Task | Deliverable |
|-----|------|-------------|
| 11 | Source validation API | External verification |
| 12 | Source transparency UI | Show quality scores |
| 13 | Error handling | Graceful degradation |
| 14 | Bug fixes | Issue resolution |
| 15 | Final testing | Full test suite |

**Milestone**: v0.7.0 ready for release

---

## 4. Task Details

### 4.1 P0 Tasks (Must Have)

| Task ID | Description | Estimated Hours | Owner |
|---------|-------------|-----------------|-------|
| T01 | Source scoring algorithm design | 8 | - |
| T02 | Domain reputation scoring | 12 | Jarvis |
| T03 | Content freshness scoring | 8 | Jarvis |
| T04 | Citation tracking system | 16 | Jarvis |
| T05 | Report citation injection | 12 | Jarvis |
| T06 | Citation format support | 8 | Jarvis |

**Total P0**: ~64 hours

### 4.2 P1 Tasks (Should Have)

| Task ID | Description | Estimated Hours | Owner |
|---------|-------------|-----------------|-------|
| T07 | Source validation API | 16 | - |
| T08 | Source transparency display | 12 | - |
| T09 | Author credibility scoring | 12 | - |

**Total P1**: ~40 hours

### 4.3 P2 Tasks (Nice to Have)

| Task ID | Description | Estimated Hours |
|---------|-------------|-----------------|
| T10 | Fact-checking integration | 24 |
| T11 | Multiple citation styles | 8 |

---

## 5. Technical Design

### 5.1 Source Scoring Model

```
Source Score = Domain Score × 0.4 + Freshness Score × 0.3 + Authority Score × 0.3
```

**Domain Score Factors**:
- Known reputable domains (academic, government)
- Domain age and history
- SSL/TLS presence
- Known spam/malicious indicators

**Freshness Score Factors**:
- Publication date
- Last modified date
- Content update frequency
- Topic时效性 requirements

**Authority Score Factors**:
- Author reputation
- Citation count
- Publication venue
- Peer review status

### 5.2 Citation Data Structure

```python
class Citation:
    source_id: str
    url: str
    title: str
    domain: str
    published_date: Optional[datetime]
    accessed_date: datetime
    quality_score: float
    relevant_snippet: str
    
class ReportCitation:
    citation: Citation
    section: str
    paragraph: int
    claim: str
```

### 5.3 Integration with Existing Modules

```
Research Engine
    ├── Search Providers → Source Scoring
    ├── Content Extraction → Citation Tracking
    ├── LLM Summarization → Claim Attribution
    └── Report Generator → Citation Injection
```

---

## 6. Dependencies

```
Week 1: Source Quality Scoring
  └── Week 2: Citation System
        ↓
Week 3: Validation & Polish
```

**External Dependencies**:
- None required (self-contained scoring)

---

## 7. API Changes

### 7.1 New Interfaces

```python
# Source scoring
from deepclaw.validation import SourceScorer

scorer = SourceScorer()
score = scorer.score_source(url, content, metadata)

# Citation tracking
from deepclaw.validation import CitationTracker

tracker = CitationTracker()
tracker.add_source(url, content, metadata)
citations = tracker.get_citations()

# Report with citations
from deepclaw.reports import CitationFormatter

formatter = CitationFormatter(style="apa")
report = formatter.format(report_content, citations)
```

### 7.2 Configuration

```json
{
  "validation": {
    "sourceScoring": {
      "enabled": true,
      "minScore": 0.5,
      "weights": {
        "domain": 0.4,
        "freshness": 0.3,
        "authority": 0.3
      }
    },
    "citation": {
      "enabled": true,
      "style": "apa",
      "includeQualityScore": true
    }
  }
}
```

---

## 8. Success Criteria

- [ ] Source quality scoring works for 90%+ of sources
- [ ] All report claims have citations
- [ ] Citation format supports APA, MLA, Chicago
- [ ] Source quality visible in results
- [ ] 60+ new tests added
- [ ] 80% test coverage maintained
- [ ] No critical bugs

---

## 9. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Scoring algorithm bias | Medium | Medium | Use multiple factors |
| External API rate limits | Low | Medium | Cache results |
| Performance impact | Medium | Medium | Async scoring |
| Citation format complexity | Low | Low | Start with basic styles |

---

## 10. Post-Release (v0.8.0+)

### Potential Next Steps

- **Fact-checking AI**: Verify claims against known facts
- **User feedback loop**: Let users correct source quality
- **Advanced validation**: Integration with fact-checking services
- **Citation export**: BibTeX, EndNote formats

---

## 11. Next Steps

1. **Review this plan** → Peter
2. **Approve scope** → Peter
3. **Start Week 1** → Jarvis
4. **Daily standups** → Progress tracking

---

**Document Status**: Draft
**Last Updated**: 2026-05-06
**Approved By**: 
**Start Date**: 

---

## Appendix: Reference Links

- [Vision Document](../vision.md)
- [v0.6.0 Release Notes](../CHANGELOG.md)
- [Source Validation Research](../research/source-validation.md)
