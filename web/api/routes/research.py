"""
ResearchClaw Research API Endpoint
"""
import asyncio
import uuid
import sys
sys.path.insert(0, 'src')

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse

from web.api.auth import get_api_key
from web.api.models import (
    ResearchRequest, 
    ResearchResponse, 
    ResearchResult,
    ResearchProgress
)

router = APIRouter(prefix="/research", tags=["Research"])

# In-memory task storage (for demo - use Redis in production)
research_tasks = {}

# Depth mapping
DEPTH_MAP = {
    "brief": 1,
    "medium": 3,
    "thorough": 5
}


async def run_research_task(task_id: str, request: ResearchRequest):
    """Background task to run research"""
    try:
        # Update status to running
        research_tasks[task_id]["status"] = "running"
        research_tasks[task_id]["progress"] = 0
        research_tasks[task_id]["current_step"] = "Initializing research..."
        
        # Import ResearchClaw components
        from researchclaw.research.runner import run_research
        
        research_tasks[task_id]["progress"] = 10
        research_tasks[task_id]["current_step"] = "Running research..."
        
        # Map depth string to int
        depth = DEPTH_MAP.get(request.depth, 3)
        
        # Run research - this is a sync function, run in thread pool
        loop = asyncio.get_event_loop()
        report = await loop.run_in_executor(
            None,
            run_research,
            request.query,
            depth
        )
        
        research_tasks[task_id]["progress"] = 100
        research_tasks[task_id]["status"] = "completed"
        research_tasks[task_id]["current_step"] = "Research complete"
        research_tasks[task_id]["result"] = {
            "query": request.query,
            "report": report.content if hasattr(report, 'content') else str(report),
            "sources": [],
            "metadata": {
                "depth": request.depth,
                "max_sources": request.max_sources,
                "output_format": request.output_format
            }
        }
        
    except Exception as e:
        research_tasks[task_id]["status"] = "failed"
        research_tasks[task_id]["current_step"] = "Research failed"
        research_tasks[task_id]["error"] = str(e)


@router.post("", response_model=ResearchResponse)
async def research(
    request: ResearchRequest,
    background_tasks: BackgroundTasks,
    api_key: dict = Depends(get_api_key)
):
    """
    Start a research task.
    
    - **query**: Research topic
    - **depth**: Research depth (brief, medium, thorough)
    - **max_sources**: Maximum sources to analyze (1-30)
    - **include_recommendations**: Include recommendations in report
    - **output_format**: Output format (markdown, html, pdf)
    """
    # Generate task ID
    task_id = str(uuid.uuid4())
    
    # Store task
    research_tasks[task_id] = {
        "query": request.query,
        "status": "queued",
        "progress": 0,
        "current_step": "Queued",
        "created_at": asyncio.get_event_loop().time()
    }
    
    # Start background task
    background_tasks.add_task(run_research_task, task_id, request)
    
    return ResearchResponse(
        task_id=task_id,
        status="queued",
        message=f"Research task created. Use task_id to check status."
    )


@router.get("/status/{task_id}", response_model=ResearchProgress)
async def get_research_status(
    task_id: str,
    api_key: dict = Depends(get_api_key)
):
    """Get research task status"""
    if task_id not in research_tasks:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )
    
    task = research_tasks[task_id]
    return ResearchProgress(
        task_id=task_id,
        status=task["status"],
        progress=task.get("progress", 0),
        current_step=task.get("current_step"),
        message=task.get("error")
    )


@router.get("/result/{task_id}", response_model=ResearchResult)
async def get_research_result(
    task_id: str,
    api_key: dict = Depends(get_api_key)
):
    """Get research task result"""
    if task_id not in research_tasks:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )
    
    task = research_tasks[task_id]
    
    if task["status"] != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Research not completed. Current status: {task['status']}"
        )
    
    result = task.get("result", {})
    return ResearchResult(
        task_id=task_id,
        query=result.get("query", ""),
        report=result.get("report", ""),
        sources=result.get("sources", []),
        metadata=result.get("metadata", {})
    )


@router.delete("/task/{task_id}")
async def cancel_research(
    task_id: str,
    api_key: dict = Depends(get_api_key)
):
    """Cancel a research task"""
    if task_id not in research_tasks:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )
    
    task = research_tasks[task_id]
    if task["status"] in ["completed", "failed"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel task with status: {task['status']}"
        )
    
    task["status"] = "cancelled"
    return {"message": "Task cancelled", "task_id": task_id}
