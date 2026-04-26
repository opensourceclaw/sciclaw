"""
ResearchClaw Reports API Endpoint
"""
import os
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse

from web.api.auth import get_api_key
from web.api.models import ReportListResponse, ReportMetadata, ReportContentResponse

router = APIRouter(prefix="/reports", tags=["Reports"])

# Reports directory
REPORTS_DIR = "reports"


@router.get("", response_model=ReportListResponse)
async def list_reports(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    api_key: dict = Depends(get_api_key)
):
    """
    List all research reports.
    
    - **limit**: Maximum number of reports to return
    - **offset**: Number of reports to skip
    """
    if not os.path.exists(REPORTS_DIR):
        return ReportListResponse(reports=[], total=0)
    
    reports = []
    for filename in os.listdir(REPORTS_DIR):
        if filename.endswith((".md", ".html")):
            filepath = os.path.join(REPORTS_DIR, filename)
            stat = os.stat(filepath)
            
            # Extract task_id from filename
            task_id = os.path.splitext(filename)[0]
            
            reports.append(ReportMetadata(
                task_id=task_id,
                query=task_id,  # Could be extracted from file content
                status="completed",
                created_at=datetime.fromtimestamp(stat.st_ctime),
                completed_at=datetime.fromtimestamp(stat.st_mtime)
            ))
    
    # Sort by date (newest first)
    reports.sort(key=lambda x: x.created_at, reverse=True)
    
    total = len(reports)
    paginated_reports = reports[offset:offset + limit]
    
    return ReportListResponse(
        reports=paginated_reports,
        total=total
    )


@router.get("/{task_id}", response_model=ReportContentResponse)
async def get_report(
    task_id: str,
    format: str = Query("markdown", enum=["markdown", "html", "text"]),
    api_key: dict = Depends(get_api_key)
):
    """
    Get a specific report.
    
    - **task_id**: Task ID of the report
    - **format**: Output format (markdown, html, text)
    """
    # Try different extensions
    extensions = [".md", ".html", ".txt"]
    
    for ext in extensions:
        filepath = os.path.join(REPORTS_DIR, f"{task_id}{ext}")
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                content = f.read()
            
            return ReportContentResponse(
                task_id=task_id,
                query=task_id,
                content=content,
                format=format,
                sources=[],  # Could be extracted from metadata
                metadata={"format": format}
            )
    
    raise HTTPException(
        status_code=404,
        detail="Report not found"
    )


@router.get("/{task_id}/download")
async def download_report(
    task_id: str,
    api_key: dict = Depends(get_api_key)
):
    """
    Download a report file.
    """
    # Try different extensions
    extensions = [".md", ".html", ".txt"]
    
    for ext in extensions:
        filepath = os.path.join(REPORTS_DIR, f"{task_id}{ext}")
        if os.path.exists(filepath):
            return FileResponse(
                filepath,
                filename=f"research_report_{task_id}{ext}",
                media_type="application/octet-stream"
            )
    
    raise HTTPException(
        status_code=404,
        detail="Report not found"
    )


@router.delete("/{task_id}")
async def delete_report(
    task_id: str,
    api_key: dict = Depends(get_api_key)
):
    """
    Delete a report.
    """
    deleted = False
    
    # Try different extensions
    extensions = [".md", ".html", ".txt"]
    
    for ext in extensions:
        filepath = os.path.join(REPORTS_DIR, f"{task_id}{ext}")
        if os.path.exists(filepath):
            os.remove(filepath)
            deleted = True
            break
    
    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )
    
    return {"message": "Report deleted", "task_id": task_id}
