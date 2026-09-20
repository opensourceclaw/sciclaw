# SciClaw API Documentation

## Overview

SciClaw API provides programmatic access to search, research, and report management functionality.

**Base URL:** `http://localhost:8000`
**API Version:** v1
**Documentation:** `/docs` (Swagger UI)

## Authentication

All endpoints require an API key passed in the `X-API-Key` header.

```bash
curl -H "X-API-Key: rc_your_api_key" ...
```

### Get API Key

First, you need to create an API key:

```bash
POST /api/v1/auth/keys
```

Request:
```json
{
  "name": "my-app",
  "expires_in_days": 90
}
```

Response:
```json
{
  "key": "rc_xxxxxxxxxxxxx",
  "name": "my-app",
  "created_at": "2026-04-26T20:00:00",
  "expires_at": "2026-07-26T20:00:00"
}
```

## Endpoints

### Health Check

```
GET /health
```

Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "version": "0.4.0",
  "timestamp": "2026-04-26T20:00:00"
}
```

---

### Search

```
POST /api/v1/search
GET /api/v1/search?query=your+query&max_results=10
```

Search the web for information.

**Request Body:**
```json
{
  "query": "artificial intelligence",
  "max_results": 10,
  "include_summary": true
}
```

**Response:**
```json
{
  "query": "artificial intelligence",
  "total_results": 10,
  "results": [
    {
      "title": "Artificial Intelligence - Wikipedia",
      "url": "https://en.wikipedia.org/wiki/Artificial_intelligence",
      "snippet": "...",
      "score": null
    }
  ],
  "timestamp": "2026-04-26T20:00:00"
}
```

---

### Research

```
POST /api/v1/research
```

Start a research task (async).

**Request Body:**
```json
{
  "query": "What is machine learning?",
  "depth": "brief",
  "max_sources": 5,
  "include_recommendations": true,
  "output_format": "markdown"
}
```

**Response:**
```json
{
  "task_id": "uuid-here",
  "status": "queued",
  "message": "Research task created. Use task_id to check status."
}
```

#### Get Research Status

```
GET /api/v1/research/status/{task_id}
```

#### Get Research Result

```
GET /api/v1/research/result/{task_id}
```

#### Cancel Research

```
DELETE /api/v1/research/task/{task_id}
```

---

### Reports

```
GET /api/v1/reports
```

List all research reports.

**Response:**
```json
{
  "reports": [
    {
      "task_id": "ai_trends_2026",
      "query": "ai_trends_2026",
      "status": "completed",
      "created_at": "2026-04-26T15:17:30",
      "completed_at": "2026-04-26T15:17:30"
    }
  ],
  "total": 1
}
```

#### Get Report Content

```
GET /api/v1/reports/{task_id}
```

#### Download Report

```
GET /api/v1/reports/{task_id}/download
```

#### Delete Report

```
DELETE /api/v1/reports/{task_id}
```

---

### WebSocket

```
WS /ws
WS /ws/{task_id}
```

Real-time progress updates.

**Connect:**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');
ws.onopen = () => {
  ws.send(JSON.stringify({type: 'subscribe', task_id: 'your-task-id'}));
};
ws.onmessage = (event) => {
  console.log(JSON.parse(event.data));
};
```

**Message Types:**
- `progress` - Task progress update
- `status` - Status change
- `error` - Error occurred
- `result` - Research complete

---

## Error Responses

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized (missing/invalid API key) |
| 404 | Not Found |
| 500 | Internal Server Error |

**Error Example:**
```json
{
  "detail": "Invalid or expired API Key"
}
```

---

## Rate Limits

Default rate limits (can be configured):
- 100 requests/minute for search
- 10 concurrent research tasks

---

## Python Client Example

```python
import requests

API_KEY = "rc_your_api_key"
BASE_URL = "http://localhost:8000"

headers = {"X-API-Key": API_KEY}

# Search
response = requests.post(
    f"{BASE_URL}/api/v1/search",
    json={"query": "AI", "max_results": 5},
    headers=headers
)
print(response.json())

# Start Research
response = requests.post(
    f"{BASE_URL}/api/v1/research",
    json={"query": "Machine Learning", "depth": "brief"},
    headers=headers
)
task_id = response.json()["task_id"]

# Check Status
response = requests.get(
    f"{BASE_URL}/api/v1/research/status/{task_id}",
    headers=headers
)
print(response.json())
```

---

## Python Skill API

For OpenClaw Skill integration, use the Python API directly.

### Installation

```bash
pip install git+https://github.com/liantian-cn/deepclaw.git
```

### Basic Usage

```python
from skill import SciClawSkill, create_skill

# Create skill instance
skill = create_skill()

# Load skill
skill.on_load()

# Research
result = skill.research("artificial intelligence trends", depth=3)
print(result.content)

# Search
results = skill.search("machine learning", limit=10)
for r in results:
    print(r.title, r.url)

# LLM Chat
response = skill.chat("What is Python?", provider="deepseek")
print(response)
```

### Skill Interface

See [SKILL.md](../skill/SKILL.md) for complete command reference.
