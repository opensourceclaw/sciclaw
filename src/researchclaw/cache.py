# Copyright 2026 OpenClaw
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
Caching Module
"""

import time
import hashlib
import json
from typing import Any, Optional, Dict, Callable
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from functools import wraps


@dataclass
class CacheEntry:
    """Cache entry with metadata"""
    key: str
    value: Any
    created_at: float
    expires_at: float

    def is_expired(self, ttl: int) -> bool:
        """Check if entry is expired

        Args:
            ttl: Time to live in seconds

        Returns:
            bool: True if expired
        """
        return time.time() > self.expires_at


class Cache:
    """Simple in-memory cache with TTL support"""

    def __init__(self, ttl: int = 3600, max_size: int = 100):
        """Initialize cache

        Args:
            ttl: Time to live in seconds
            max_size: Maximum cache size
        """
        self.ttl = ttl
        self.max_size = max_size
        self._cache: Dict[str, CacheEntry] = {}
        self._hits = 0
        self._misses = 0

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache

        Args:
            key: Cache key

        Returns:
            Any: Cached value or None
        """
        if key in self._cache:
            entry = self._cache[key]
            if not entry.is_expired(self.ttl):
                self._hits += 1
                return entry.value
            else:
                del self._cache[key]

        self._misses += 1
        return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value in cache

        Args:
            key: Cache key
            value: Value to cache
            ttl: Custom TTL (uses default if None)
        """
        # Evict oldest if at capacity
        if len(self._cache) >= self.max_size:
            self._evict_oldest()

        ttl = ttl or self.ttl
        now = time.time()

        self._cache[key] = CacheEntry(
            key=key,
            value=value,
            created_at=now,
            expires_at=now + ttl,
        )

    def delete(self, key: str) -> bool:
        """Delete entry from cache

        Args:
            key: Cache key

        Returns:
            bool: True if deleted
        """
        if key in self._cache:
            del self._cache[key]
            return True
        return False

    def clear(self) -> None:
        """Clear all cache entries"""
        self._cache.clear()
        self._hits = 0
        self._misses = 0

    def _evict_oldest(self) -> None:
        """Evict oldest entry"""
        if not self._cache:
            return

        oldest_key = min(
            self._cache.keys(),
            key=lambda k: self._cache[k].created_at
        )
        del self._cache[oldest_key]

    def stats(self) -> Dict[str, Any]:
        """Get cache statistics

        Returns:
            Dict: Cache stats
        """
        total = self._hits + self._misses
        hit_rate = self._hits / total if total > 0 else 0

        return {
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": hit_rate,
            "size": len(self._cache),
            "max_size": self.max_size,
        }


class FileCache:
    """File-based cache with TTL support"""

    def __init__(self, cache_dir: str = ".cache/researchclaw", ttl: int = 3600):
        """Initialize file cache

        Args:
            cache_dir: Directory for cache files
            ttl: Time to live in seconds
        """
        self.cache_dir = Path(cache_dir)
        self.ttl = ttl
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _get_cache_path(self, key: str) -> Path:
        """Get cache file path for key

        Args:
            key: Cache key

        Returns:
            Path: Cache file path
        """
        # Hash key to create safe filename
        key_hash = hashlib.md5(key.encode()).hexdigest()
        return self.cache_dir / f"{key_hash}.json"

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache

        Args:
            key: Cache key

        Returns:
            Any: Cached value or None
        """
        cache_path = self._get_cache_path(key)

        if not cache_path.exists():
            return None

        try:
            with open(cache_path, "r") as f:
                data = json.load(f)

            # Check expiration
            if time.time() > data["expires_at"]:
                cache_path.unlink()
                return None

            return data["value"]
        except Exception:
            return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value in cache

        Args:
            key: Cache key
            value: Value to cache
            ttl: Custom TTL
        """
        ttl = ttl or self.ttl
        now = time.time()

        data = {
            "key": key,
            "value": value,
            "created_at": now,
            "expires_at": now + ttl,
        }

        cache_path = self._get_cache_path(key)
        with open(cache_path, "w") as f:
            json.dump(data, f)

    def clear(self) -> None:
        """Clear all cache files"""
        for cache_file in self.cache_dir.glob("*.json"):
            cache_file.unlink()


def cached(ttl: int = 3600, key_func: Optional[Callable] = None):
    """Decorator for caching function results

    Args:
        ttl: Time to live in seconds
        key_func: Function to generate cache key

    Returns:
        Decorator function
    """
    _cache = Cache(ttl=ttl)

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"

            # Try to get from cache
            cached_value = _cache.get(cache_key)
            if cached_value is not None:
                return cached_value

            # Execute function and cache result
            result = func(*args, **kwargs)
            _cache.set(cache_key, result, ttl)

            return result

        # Expose cache for inspection
        wrapper.cache = _cache
        return wrapper

    return decorator


# Global cache instance
_global_cache = Cache(ttl=3600)


def get_cache() -> Cache:
    """Get global cache instance

    Returns:
        Cache: Global cache
    """
    return _global_cache


def clear_cache() -> None:
    """Clear global cache"""
    _global_cache.clear()


__all__ = ["Cache", "FileCache", "cached", "get_cache", "clear_cache"]
