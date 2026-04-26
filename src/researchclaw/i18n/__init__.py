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
Internationalization (i18n) module for ResearchClaw.
Supports Chinese (zh) and English (en) languages.
"""

from typing import Dict, Optional
from pathlib import Path
import json
import os


class I18n:
    """Internationalization handler"""

    _instance: Optional["I18n"] = None
    _current_lang: str = "en"
    _translations: Dict[str, Dict[str, str]] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load_translations()
            cls._translations = cls._instance._translations
        return cls._instance

    def _load_translations(self):
        """Load all translation files"""
        # Load built-in translations
        I18n._translations = {
            "en": self._get_english_strings(),
            "zh": self._get_chinese_strings(),
        }

    def _get_english_strings(self) -> Dict[str, str]:
        """Get English translations"""
        return {
            # Banner
            "banner.title": "ResearchClaw",
            "banner.subtitle": "Deep Research Framework",

            # General
            "general.topic": "Topic",
            "general.depth": "Depth",
            "general.engine": "Engine",
            "general.output": "Output",
            "general.format": "Format",
            "general.success": "Success",
            "general.error": "Error",
            "general.warning": "Warning",
            "general.complete": "Complete",
            "general.duration": "Duration",
            "general.sections": "Sections",

            # Research command
            "research.title": "Researching",
            "research.topic": "Topic",
            "research.depth": "Depth",
            "research.engine": "Engine",
            "research.output": "Output",
            "research.complete": "Research Complete",
            "research.sections": "Research Sections",
            "research.sources": "Sources",
            "research.confidence": "Confidence",
            "research.saved": "Report saved to",
            "research.preview": "Report Preview",

            # Search command
            "search.title": "Searching",
            "search.for": "Searching for",
            "search.limit": "Limit",
            "search.found": "Found {count} results",
            "search.no_results": "No results found",

            # Engines command
            "engines.title": "Available Search Engines",
            "engines.requires_key": "Requires API Key",
            "engines.status": "Status",
            "engines.available": "Available",
            "engines.note": "Note: Set API keys in config.json",

            # Init command
            "init.existing": "Project already exists at {path}",
            "init.initializing": "Initializing ResearchClaw project",
            "init.success": "Project initialized successfully!",

            # LLM commands
            "llm.provider": "Provider",
            "llm.model": "Model",
            "llm.requires_key": "Requires API key",
            "llm.set_key": "Set {provider}_API_KEY environment variable",
            "llm.note": "Note: Set API keys via environment variables (e.g., DEEPSEEK_API_KEY)",

            # LLMs command
            "llms.title": "Available LLM Providers",
            "llms.default_model": "Default Model",

            # Errors
            "error.api_key": "{engine} requires API key",
            "error.invalid_engine": "Invalid engine '{engine}'. Available: {available}",
            "error.invalid_provider": "Invalid provider '{provider}'. Available: {available}",

            # CLI options
            "cli.verbose": "Verbose output",
            "cli.quiet": "Suppress all output except errors",
        }

    def _get_chinese_strings(self) -> Dict[str, str]:
        """Get Chinese translations"""
        return {
            # Banner
            "banner.title": "ResearchClaw",
            "banner.subtitle": "深度研究框架",

            # General
            "general.topic": "主题",
            "general.depth": "深度",
            "general.engine": "引擎",
            "general.output": "输出",
            "general.format": "格式",
            "general.success": "成功",
            "general.error": "错误",
            "general.warning": "警告",
            "general.complete": "完成",
            "general.duration": "耗时",
            "general.sections": "章节",

            # Research command
            "research.title": "研究中",
            "research.topic": "主题",
            "research.depth": "深度",
            "research.engine": "搜索引擎",
            "research.output": "输出",
            "research.complete": "研究完成",
            "research.sections": "研究章节",
            "research.sources": "来源",
            "research.confidence": "置信度",
            "research.saved": "报告已保存至",
            "research.preview": "报告预览",

            # Search command
            "search.title": "搜索中",
            "search.for": "搜索",
            "search.limit": "限制",
            "search.found": "找到 {count} 条结果",
            "search.no_results": "未找到结果",

            # Engines command
            "engines.title": "可用搜索引擎",
            "engines.requires_key": "需要 API 密钥",
            "engines.status": "状态",
            "engines.available": "可用",
            "engines.note": "注意: 在 config.json 中设置 API 密钥",

            # Init command
            "init.existing": "项目已存在于 {path}",
            "init.initializing": "初始化 ResearchClaw 项目",
            "init.success": "项目初始化成功！",

            # LLM commands
            "llm.provider": "提供商",
            "llm.model": "模型",
            "llm.requires_key": "需要 API 密钥",
            "llm.set_key": "设置 {provider}_API_KEY 环境变量",
            "llm.note": "注意: 通过环境变量设置 API 密钥 (如 DEEPSEEK_API_KEY)",

            # LLMs command
            "llms.title": "可用 LLM 提供商",
            "llms.default_model": "默认模型",

            # Errors
            "error.api_key": "{engine} 需要 API 密钥",
            "error.invalid_engine": "无效的引擎 '{engine}'。可用: {available}",
            "error.invalid_provider": "无效的提供商 '{provider}'。可用: {available}",

            # CLI options
            "cli.verbose": "详细输出",
            "cli.quiet": "仅显示错误",
        }

    @classmethod
    def set_language(cls, lang: str):
        """Set the current language

        Args:
            lang: Language code ('en' or 'zh')
        """
        # Ensure instance is created
        if cls._instance is None:
            cls._instance = cls()
        if lang in cls._instance._translations:
            cls._current_lang = lang
        else:
            raise ValueError(f"Unsupported language: {lang}. Supported: en, zh")

    @classmethod
    def get_language(cls) -> str:
        """Get the current language"""
        # Ensure instance is created
        if cls._instance is None:
            cls._instance = cls()
        return cls._current_lang

    @classmethod
    def t(cls, key: str, **kwargs) -> str:
        """Translate a key

        Args:
            key: Translation key (e.g., 'general.topic')
            **kwargs: Format arguments

        Returns:
            str: Translated string
        """
        # Ensure instance is created
        if cls._instance is None:
            cls._instance = cls()
        translations = cls._instance._translations.get(cls._current_lang, cls._instance._translations["en"])
        result = translations.get(key, key)

        # Format with arguments
        if kwargs:
            result = result.format(**kwargs)

        return result

    @classmethod
    def available_languages(cls) -> list:
        """Get list of available language codes"""
        return list(cls._instance._translations.keys())


# Convenience functions
def set_language(lang: str):
    """Set the current language"""
    I18n.set_language(lang)


def get_language() -> str:
    """Get the current language"""
    return I18n.get_language()


def t(key: str, **kwargs) -> str:
    """Translate a key"""
    return I18n.t(key, **kwargs)


__all__ = ["I18n", "set_language", "get_language", "t"]
