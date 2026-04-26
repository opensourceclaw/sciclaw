"""
ResearchClaw API Models
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# --- Search Models ---
class SearchRequest(BaseModel):
    """Search request model"""
    query: str = Field(..., description="Search query string")
    max_results: int = Field(default=10, ge=1, le=50, description="Maximum number of results")
    include_summary: bool = Field(default=True, description="Include AI summary")


class SearchResultItem(BaseModel):
    """Individual search result"""
    title: str
    url: str
    snippet: str
    score: Optional[float] = None


class SearchResponse(BaseModel):
    """Search response model"""
    query: str
    total_results: int
    results: List[SearchResultItem]
    timestamp: datetime = Field(default_factory=datetime.now)


# --- Research Models ---
class ResearchRequest(BaseModel):
    """Research request model"""
    query: str = Field(..., description="Research topic")
    depth: str = Field(default="medium", description="Research depth: brief, medium, thorough")
    max_sources: int = Field(default=10, ge=1, le=30, description="Maximum sources to analyze")
    include_recommendations: bool = Field(default=True, description="Include recommendations")
    output_format: str = Field(default="markdown", description="Output format: markdown, html, pdf")


class ResearchProgress(BaseModel):
    """Research progress update"""
    task_id: str
    status: str  # queued, running, completed, failed
    progress: float = Field(ge=0, le=100)
    current_step: Optional[str] = None
    message: Optional[str] = None


class ResearchResponse(BaseModel):
    """Research response model"""
    task_id: str
    status: str
    message: str
    report_url: Optional[str] = None


class ResearchResult(BaseModel):
    """Research result (when completed)"""
    task_id: str
    query: str
    report: str
    sources: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.now)


# --- Reports Models ---
class ReportMetadata(BaseModel):
    """Report metadata"""
    task_id: str
    query: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None


class ReportListResponse(BaseModel):
    """List of reports"""
    reports: List[ReportMetadata]
    total: int


class ReportContentResponse(BaseModel):
    """Report content"""
    task_id: str
    query: str
    content: str
    format: str
    sources: List[Dict[str, Any]]
    metadata: Dict[str, Any]


# --- Auth Models ---
class APIKeyRequest(BaseModel):
    """API key generation request"""
    name: str = Field(..., description="Identifier for the API key")
    expires_in_days: Optional[int] = Field(default=90, ge=1, le=365)


class APIKeyResponse(BaseModel):
    """API key response"""
    key: str
    name: str
    created_at: datetime
    expires_at: Optional[datetime]


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    timestamp: datetime = Field(default_factory=datetime.now)
