"""
ResearchClaw API Configuration
"""
import os
from typing import Optional


class APISettings:
    """API settings"""

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False

    # Security
    api_keys_file: str = "web/api_keys.json"
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    # CORS
    cors_origins: list = ["*"]

    # ResearchClaw
    deepclaw_config: str = "config.json"
    reports_dir: str = "reports"

    # WebSocket
    ws_heartbeat_interval: int = 30

    # Performance
    cache_ttl: int = 3600  # 1 hour
    search_cache_ttl: int = 1800  # 30 minutes
    enable_response_compression: bool = True

    def __init__(self):
        # Load from environment variables
        self.host = os.getenv("RESEARCHCLAW_API_HOST", self.host)
        self.port = int(os.getenv("RESEARCHCLAW_API_PORT", self.port))
        self.debug = os.getenv("RESEARCHCLAW_API_DEBUG", "false").lower() == "true"
        self.secret_key = os.getenv("RESEARCHCLAW_API_SECRET_KEY", self.secret_key)
        self.api_keys_file = os.getenv("RESEARCHCLAW_API_KEYS_FILE", self.api_keys_file)
        self.cache_ttl = int(os.getenv("RESEARCHCLAW_CACHE_TTL", self.cache_ttl))
        self.search_cache_ttl = int(os.getenv("RESEARCHCLAW_SEARCH_CACHE_TTL", self.search_cache_ttl))
        self.enable_response_compression = os.getenv("RESEARCHCLAW_COMPRESSION", "true").lower() == "true"


settings = APISettings()
