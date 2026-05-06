# DeepClaw v0.8.0 - Iteration Plan

**Version**: 1.0.0
**Date**: 2026-05-06
**Status**: Draft
**Goal**: Fact-Checking & Claim Validation

---

## 1. Release Overview

| Item | Value |
|------|-------|
| **Version** | v0.8.0 |
| **Code Name** | Truth Seeker |
| **Target Date** | 2-3 weeks from start |
| **Goal** | Implement fact-checking and claim validation capabilities |

---

## 2. Scope

### 2.1 In Scope

| Feature | Description | Priority |
|---------|-------------|----------|
| Claim Extraction | Extract verifiable claims from research | P0 |
| Fact-Check Integration | External fact-check service integration | P1 |
| Risk Warning | Flag potentially unreliable content | P0 |
| Claim Database | Local cache of verified facts | P2 |

### 2.2 Out of Scope (v0.8.x)

- User feedback learning system (Phase 3)
- Advanced AI reasoning
- Cloud deployment
- Mobile UI

---

## 3. Weekly Breakdown

### Week 1: Claim Extraction (Days 1-5)

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Design claim extraction algorithm | Claim types taxonomy |
| 2 | Implement factual claim detector | Claim detection module |
| 3 | Implement numeric claim extractor | Numbers, dates, statistics |
| 4 | Implement source attribution | Link claims to sources |
| 5 | Unit tests | Test coverage |

**Milestone**: Claim extraction working

### Week 2: Fact-Check Integration (Days 6-10)

| Day | Task | Deliverable |
|-----|------|-------------|
| 6 | Design fact-check API interface | API abstraction layer |
| 7 | Implement fact-check connector | Service integration |
| 8 | Implement risk scoring | Calculate claim risk level |
| 9 | Implement warning system | User-facing warnings |
| 10 | Integration tests | E2E tests |

**Milestone**: Fact-check integration working

### Week 3: Polish & Release (Days 11-15)

| Day | Task | Deliverable |
|-----|------|-------------|
| 11 | Claim database (optional) | Local cache |
| 12 | Error handling | Graceful degradation |
| 13 | Bug fixes | Issue resolution |
| 14 | Final testing | Full test suite |
| 15 | Release v0.8.0 | Package & publish |

**Milestone**: v0.8.0 ready for release

---

## 4. Task Details

### 4.1 P0 Tasks (Must Have)

| Task ID | Description | Estimated Hours | Owner |
|---------|-------------|-----------------|-------|
| T01 | Claim extraction algorithm design | 8 | - |
| T02 | Factual claim detector | 16 | Jarvis |
| T03 | Numeric claim extractor | 12 | Jarvis |
| T04 | Source attribution | 12 | Jarvis |
| T05 | Risk warning system | 16 | Jarvis |

**Total P0**: ~64 hours

### 4.2 P1 Tasks (Should Have)

| Task ID | Description | Estimated Hours | Owner |
|---------|-------------|-----------------|-------|
| T06 | Fact-check API interface | 16 | - |
| T07 | Service integration | 24 | - |
| T08 | Risk scoring algorithm | 12 | - |

**Total P1**: ~52 hours

### 4.3 P2 Tasks (Nice to Have)

| Task ID | Description | Estimated Hours |
|---------|-------------|-----------------|
| T09 | Claim database cache | 24 |
| T10 | Batch fact-checking | 16 |

---

## 5. Technical Design

### 5.1 Claim Types Taxonomy

```python
class ClaimType(Enum):
    FACTUAL = "factual"           # Verifiable facts
    NUMERIC = "numeric"           # Numbers, statistics
    QUOTATION = "quotation"       # Direct quotes
    COMPARISON = "comparison"     # Claims comparing things
    CAUSATION = "causation"       # Cause-effect claims
    OPINION = "opinion"           # Subjective statements
```

### 5.2 Risk Scoring Model

```
Risk Score = Source Score × 0.3 + Claim Type × 0.3 + Verification Status × 0.4

Risk Levels:
- LOW: High-quality source + factual + verified
- MEDIUM: Medium-quality source + factual + unverified
- HIGH: Low-quality source + numeric + unverified
- CRITICAL: Unverifiable + contradictory sources
```

### 5.3 Integration Architecture

```
Research Engine
    ├── Search Providers
    ├── Content Extraction
    ├── LLM Summarization
    └── Claim Extractor → Risk Scorer → Warning System
                              ↓
                        Fact-Check API
```

---

## 6. API Changes

### 6.1 New Interfaces

```python
# Claim extraction
from deepclaw.validation import ClaimExtractor

extractor = ClaimExtractor()
claims = extractor.extract_claims(content, sources)

# Risk scoring
from deepclaw.validation import RiskScorer

scorer = RiskScorer()
risk_level = scorer.calculate_risk(claim, source_quality)

# Fact-check service
from deepclaw.validation import FactCheckService

service = FactCheckService()
result = service.verify(claim)
```

### 6.2 Configuration

```json
{
  "validation": {
    "factCheck": {
      "enabled": true,
      "services": ["factcheck", "custom"],
      "riskThreshold": 0.7,
      "showWarnings": true
    }
  }
}
```

---

## 7. Success Criteria

- [ ] Claim extraction covers 80%+ of research content
- [ ] Risk warnings displayed for low-quality claims
- [ ] Numeric claims have date/source attribution
- [ ] 60+ new tests added
- [ ] 80% test coverage maintained
- [ ] No critical bugs

---

## 8. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Over-blocking | Medium | Medium | Allow user override |
| API rate limits | Low | Medium | Cache results |
| False positives | Medium | Medium | Multiple source verification |
| Performance impact | Medium | Medium | Async processing |

---

## 9. Post-Release (v0.9.0+)

### Potential Next Steps

- **User Feedback Loop**: Let users correct fact-check results
- **Batch Verification**: Check all claims at once
- **Custom Rules**: User-defined claim patterns

---

## 10. Next Steps

1. **Review this plan** → Peter
2. **Approve scope** → Peter
3. **Start Week 1** → Jarvis

---

**Document Status**: Draft
**Last Updated**: 2026-05-06
**Approved By**: 
**Start Date**: 

---

## Appendix: Reference Links

- [Vision Document](../vision.md)
- [v0.7.0 Release Notes](../CHANGELOG.md)
- [Fact-Check Research](../research/fact-checking.md)
