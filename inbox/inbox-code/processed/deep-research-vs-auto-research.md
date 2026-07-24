# Task: Deep Research vs Auto Research Architecture Decision

**From**: Friday (A)
**To**: Jarvis (B) & Edith (C)
**Date**: 2026-07-22
**Project**: deepclaw
**Priority**: High

---

## Question

Should Deep Research and Auto Research be in one system or separate systems?

---

## Background

DeepClaw currently focuses on "Deep Research" - a human-AI collaborative research partner.

Recent research papers (from arXiv) suggest two distinct patterns:
1. **Deep Research**: Human-guided, depth-first, quality-focused
2. **Auto Research**: AI-autonomous, batch processing, efficiency-focused

We need to decide the architecture for the next iteration.

---

## Two Options

### Option A: Merge (One System)
- Single entry point for both use cases
- Shared infrastructure
- Lower maintenance cost
- Risk: features may compromise each other

### Option B: Separate (Two Systems)
- Clear separation of concerns
- Independent optimization
- Higher maintenance cost
- Clear positioning

---

## Key Differences

| Dimension | Deep Research | Auto Research |
|-----------|---------------|---------------|
| User Role | Expert guides direction | Fully autonomous |
| Interaction | Human-AI collaboration | AI-driven |
| Goal | Depth over breadth | Speed and scale |
| Quality Control | Human把关 | Auto verification |

---

## Request

Please provide your recommendation:
1. Which option do you prefer?
2. Why?
3. What are the trade-offs?

---

**Project Location**: `/Users/liantian/workspace/osprojects/deepclaw`
