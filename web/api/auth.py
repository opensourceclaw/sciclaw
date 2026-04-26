"""
ResearchClaw API Authentication
"""
import json
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader
from web.api.config import settings

# API Key header
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


class APIKeyManager:
    """Manages API keys"""
    
    def __init__(self, keys_file: str = None):
        self.keys_file = keys_file or settings.api_keys_file
        self._ensure_file()
    
    def _ensure_file(self):
        """Ensure keys file exists"""
        if not os.path.exists(self.keys_file):
            os.makedirs(os.path.dirname(self.keys_file), exist_ok=True)
            self._save_keys({})
    
    def _load_keys(self) -> dict:
        """Load API keys from file"""
        try:
            with open(self.keys_file, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return {}
    
    def _save_keys(self, keys: dict):
        """Save API keys to file"""
        with open(self.keys_file, 'w') as f:
            json.dump(keys, f, indent=2, default=str)
    
    def create_key(self, name: str, expires_in_days: int = 90) -> tuple[str, datetime]:
        """Create a new API key"""
        key = f"rc_{secrets.token_urlsafe(32)}"
        expires_at = datetime.now() + timedelta(days=expires_in_days)
        
        keys = self._load_keys()
        keys[key] = {
            "name": name,
            "created_at": datetime.now().isoformat(),
            "expires_at": expires_at.isoformat(),
            "active": True
        }
        self._save_keys(keys)
        
        return key, expires_at
    
    def validate_key(self, key: str) -> Optional[dict]:
        """Validate an API key"""
        if not key:
            return None
            
        keys = self._load_keys()
        key_data = keys.get(key)
        
        if not key_data:
            return None
        
        # Check if active
        if not key_data.get("active", True):
            return None
        
        # Check expiration
        expires_at = key_data.get("expires_at")
        if expires_at:
            exp_date = datetime.fromisoformat(expires_at)
            if datetime.now() > exp_date:
                return None
        
        return key_data
    
    def revoke_key(self, key: str) -> bool:
        """Revoke an API key"""
        keys = self._load_keys()
        if key in keys:
            keys[key]["active"] = False
            self._save_keys(keys)
            return True
        return False
    
    def list_keys(self) -> List[dict]:
        """List all API keys (without the actual key)"""
        keys = self._load_keys()
        return [
            {
                "key_prefix": k[:12] + "..." if len(k) > 12 else k + "...",
                "name": v["name"],
                "created_at": v["created_at"],
                "expires_at": v.get("expires_at"),
                "active": v.get("active", True)
            }
            for k, v in keys.items()
        ]


# Global instance
api_key_manager = APIKeyManager()


async def get_api_key(api_key: str = Security(api_key_header)) -> dict:
    """Dependency to get and validate API key"""
    if api_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key is missing"
        )
    
    key_data = api_key_manager.validate_key(api_key)
    if key_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired API Key"
        )
    
    return key_data


async def get_optional_api_key(api_key: str = Security(api_key_header)) -> Optional[dict]:
    """Optional API key validation (for endpoints that work with or without auth)"""
    if api_key is None:
        return None
    return api_key_manager.validate_key(api_key)
