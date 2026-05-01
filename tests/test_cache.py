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
Tests for Cache Module
"""

import pytest
import time
import tempfile
from pathlib import Path
from deepclaw.cache import Cache, FileCache, cached, get_cache, clear_cache


class TestCache:
    """Test in-memory Cache"""

    @pytest.fixture
    def cache(self):
        return Cache(ttl=2, max_size=3)

    def test_set_get(self, cache):
        """Test set and get"""
        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"

    def test_get_nonexistent(self, cache):
        """Test getting nonexistent key"""
        assert cache.get("nonexistent") is None

    def test_expiration(self, cache):
        """Test cache expiration"""
        cache.set("key1", "value1", ttl=1)
        time.sleep(1.5)
        assert cache.get("key1") is None

    def test_delete(self, cache):
        """Test delete"""
        cache.set("key1", "value1")
        assert cache.delete("key1") is True
        assert cache.get("key1") is None

    def test_clear(self, cache):
        """Test clear"""
        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.clear()
        assert cache.get("key1") is None
        assert cache.get("key2") is None

    def test_max_size(self, cache):
        """Test max size eviction"""
        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.set("key3", "value3")
        cache.set("key4", "value4")  # Should evict oldest
        # key1 should be evicted
        assert len(cache._cache) <= 3

    def test_stats(self, cache):
        """Test stats"""
        cache.set("key1", "value1")
        cache.get("key1")
        cache.get("nonexistent")
        stats = cache.stats()
        assert stats["hits"] == 1
        assert stats["misses"] == 1


class TestFileCache:
    """Test FileCache"""

    @pytest.fixture
    def file_cache(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            yield FileCache(cache_dir=tmpdir, ttl=2)

    def test_set_get(self, file_cache):
        """Test set and get"""
        file_cache.set("key1", "value1")
        assert file_cache.get("key1") == "value1"

    def test_expiration(self, file_cache):
        """Test file cache expiration"""
        file_cache.set("key1", "value1", ttl=1)
        time.sleep(1.5)
        assert file_cache.get("key1") is None


class TestCachedDecorator:
    """Test @cached decorator"""

    @pytest.fixture
    def clear_global_cache(self):
        yield
        clear_cache()

    def test_cached_function(self, clear_global_cache):
        """Test cached decorator"""
        call_count = 0

        @cached(ttl=10)
        def expensive_func(x):
            nonlocal call_count
            call_count += 1
            return x * 2

        # First call
        result1 = expensive_func(5)
        assert result1 == 10
        assert call_count == 1

        # Second call should use cache
        result2 = expensive_func(5)
        assert result2 == 10
        assert call_count == 1


class TestGlobalCache:
    """Test global cache functions"""

    def test_get_cache(self):
        """Test get_cache"""
        cache = get_cache()
        assert isinstance(cache, Cache)

    def test_clear_cache(self):
        """Test clear_cache"""
        cache = get_cache()
        cache.set("test_key", "test_value")
        clear_cache()
        assert cache.get("test_key") is None
