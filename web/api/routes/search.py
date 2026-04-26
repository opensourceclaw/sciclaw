"""
ResearchClaw Search API Endpoint
"""
import sys
sys.path.insert(0, 'src')

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from web.api.auth import get_api_key
from web.api.models import SearchRequest, SearchResponse, SearchResultItem

router = APIRouter(prefix="/search", tags=["Search"])


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
    from researchclaw.tools.web_search import WebSearchTool
    
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
        
        return SearchResponse(
            query=request.query,
            total_results=len(results),
            results=results
        )
        
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
