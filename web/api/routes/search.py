"""
ResearchClaw Search API Endpoint
"""
import sys
sys.path.insert(0, 'src')

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from web.api.auth import get_api_key
from web.api.models import SearchRequest, SearchResponse, SearchResultItem
from web.api.config import settings

# Search result cache
_search_cache = {}


router = APIRouter(prefix="/search", tags=["Search"])


def _get_cache_key(query: str, max_results: int) -> str:
    """Generate cache key for search"""
    return f"{query}:{max_results}"


@router.post("", response_model=SearchResponse)
async def search(
    request: SearchRequest,
    api_key: dict = Depends(get_api_key)
):
    """
    Search for information on the web.

    - **query**: Search query string
    - **max_results**: Maximum number of results (1-50)
    - **include_summary**: Include AI-generated summary
    """
    # Check cache first
    cache_key = _get_cache_key(request.query, request.max_results)
    if cache_key in _search_cache:
        cached_result, cached_time = _search_cache[cache_key]
        # Check if cache is still valid
        import time
        if time.time() - cached_time < settings.search_cache_ttl:
            return cached_result

    from deepclaw.tools.web_search import WebSearchTool

    try:
        # Create search tool and perform search
        tool = WebSearchTool()
        search_results = tool.search(
            query=request.query,
            num_results=request.max_results
        )

        # Convert to response model
        results = []
        for item in search_results:
            results.append(SearchResultItem(
                title=item.title,
                url=item.url,
                snippet=item.snippet,
                score=None
            ))

        response = SearchResponse(
            query=request.query,
            total_results=len(results),
            results=results
        )

        # Cache the result
        import time
        _search_cache[cache_key] = (response, time.time())

        # Limit cache size
        if len(_search_cache) > 100:
            # Remove oldest entries
            oldest = sorted(_search_cache.items(), key=lambda x: x[1][1])[:10]
            for key, _ in oldest:
                del _search_cache[key]

        return response

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {str(e)}"
        )


@router.get("", response_model=SearchResponse)
async def search_get(
    query: str = Query(..., description="Search query"),
    max_results: int = Query(10, ge=1, le=50),
    include_summary: bool = Query(True),
    api_key: dict = Depends(get_api_key)
):
    """Search endpoint (GET method)"""
    request = SearchRequest(
        query=query,
        max_results=max_results,
        include_summary=include_summary
    )
    return await search(request, api_key)
