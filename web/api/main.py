"""
ResearchClaw API Server
"""
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.gzip import GZipMiddleware

from web.api.config import settings
from web.api.models import HealthResponse, APIKeyRequest, APIKeyResponse
from web.api.auth import get_api_key, api_key_manager
from web.api.routes import search, research, reports, websocket


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    print("Starting ResearchClaw API Server...")
    yield
    # Shutdown
    print("Shutting down ResearchClaw API Server...")


# Create FastAPI application
app = FastAPI(
    title="ResearchClaw API",
    description="Open-source Deep Research framework API",
    version="0.4.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure GZip compression for faster responses
if settings.enable_response_compression:
    app.add_middleware(GZipMiddleware, minimum_size=500)

# Include routers
app.include_router(search.router, prefix="/api/v1")
app.include_router(research.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(websocket.router)


# --- Health & Auth Endpoints ---

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        version="0.4.0",
        timestamp=datetime.now()
    )


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "name": "ResearchClaw API",
        "version": "0.4.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


# --- API Key Management ---

@app.post("/api/v1/auth/keys", response_model=APIKeyResponse)
async def create_api_key(
    request: APIKeyRequest,
    api_key: dict = Depends(get_api_key)
):
    """
    Create a new API key.
    
    - **name**: Identifier for the API key
    - **expires_in_days**: Days until key expires (1-365)
    """
    key, expires_at = api_key_manager.create_key(
        name=request.name,
        expires_in_days=request.expires_in_days
    )
    
    return APIKeyResponse(
        key=key,
        name=request.name,
        created_at=datetime.now(),
        expires_at=expires_at
    )


@app.get("/api/v1/auth/keys")
async def list_api_keys(api_key: dict = Depends(get_api_key)):
    """
    List all API keys (metadata only, not the actual keys).
    """
    keys = api_key_manager.list_keys()
    return {"keys": keys, "total": len(keys)}


@app.delete("/api/v1/auth/keys/{key_prefix}")
async def revoke_api_key(
    key_prefix: str,
    api_key: dict = Depends(get_api_key)
):
    """
    Revoke an API key.
    """
    # Find the key by prefix
    keys = api_key_manager._load_keys()
    full_key = None
    for k in keys:
        if k.startswith(key_prefix):
            full_key = k
            break
    
    if not full_key:
        return {"error": "Key not found"}, 404
    
    success = api_key_manager.revoke_key(full_key)
    if success:
        return {"message": "Key revoked", "key_prefix": key_prefix}
    return {"error": "Failed to revoke key"}, 500


# --- Run the server ---

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "web.api.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
