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
User-Agent Rotation for web requests
"""

import random
from typing import List, Optional


class UserAgentPool:
    """Pool of User-Agent strings for rotation"""

    # Desktop browsers
    USER_AGENTS = [
        # Chrome on Windows
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
        # Chrome on macOS
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
        # Firefox on Windows
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
        # Firefox on macOS
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0",
        # Safari on macOS
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
        # Edge on Windows
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
    ]

    # Mobile browsers (for responsive sites)
    MOBILE_USER_AGENTS = [
        # Chrome on Android
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        # Safari on iOS
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
    ]

    def __init__(self, use_mobile: bool = False):
        """Initialize UserAgentPool

        Args:
            use_mobile: Include mobile user agents
        """
        self.agents = self.USER_AGENTS.copy()
        if use_mobile:
            self.agents.extend(self.MOBILE_USER_AGENTS)

    def get(self) -> str:
        """Get a random user agent

        Returns:
            Random user agent string
        """
        return random.choice(self.agents)

    def get_desktop(self) -> str:
        """Get a random desktop user agent

        Returns:
            Random desktop user agent
        """
        return random.choice(self.USER_AGENTS)

    def get_mobile(self) -> str:
        """Get a random mobile user agent

        Returns:
            Random mobile user agent
        """
        return random.choice(self.MOBILE_USER_AGENTS)

    @classmethod
    def get_headers(cls, use_mobile: bool = False) -> dict:
        """Get headers dict with random user agent

        Args:
            use_mobile: Use mobile user agent

        Returns:
            Dict with headers including User-Agent
        """
        pool = cls(use_mobile=use_mobile)
        return {
            "User-Agent": pool.get(),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        }

    def rotate(self) -> str:
        """Alias for get() for semantic clarity"""
        return self.get()


# Default pool instance
_default_pool: Optional[UserAgentPool] = None


def get_user_agent(use_mobile: bool = False) -> str:
    """Get a random user agent

    Args:
        use_mobile: Include mobile user agents

    Returns:
        User agent string
    """
    global _default_pool
    if _default_pool is None:
        _default_pool = UserAgentPool(use_mobile=use_mobile)
    return _default_pool.get()


def get_default_headers() -> dict:
    """Get default headers with User-Agent

    Returns:
        Headers dict
    """
    return UserAgentPool.get_headers()


__all__ = [
    "UserAgentPool",
    "get_user_agent",
    "get_default_headers",
]
