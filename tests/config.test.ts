import { describe, it, expect } from 'vitest';
import { loadConfig, defaultConfig } from '../src/config.js';

describe('Config Module', () => {
  describe('defaultConfig', () => {
    it('should have default values', () => {
      expect(defaultConfig.defaultEngine).toBe('duckduckgo');
      expect(defaultConfig.maxResults).toBe(50);
      expect(defaultConfig.timeout).toBe(30000);
      expect(defaultConfig.outputFormat).toBe('markdown');
    });
  });

  describe('loadConfig', () => {
    it('should load default config with empty env', () => {
      const config = loadConfig({});
      expect(config.defaultEngine).toBe('duckduckgo');
      expect(config.maxResults).toBe(50);
    });

    it('should override config from env variables', () => {
      const config = loadConfig({
        DEEPCLAW_ENGINE: 'google',
        DEEPCLAW_MAX_RESULTS: '100',
        DEEPCLAW_TIMEOUT: '60000',
        DEEPCLAW_OUTPUT_FORMAT: 'html',
      });

      expect(config.defaultEngine).toBe('google');
      expect(config.maxResults).toBe(100);
      expect(config.timeout).toBe(60000);
      expect(config.outputFormat).toBe('html');
    });

    it('should handle LLM config', () => {
      const config = loadConfig({
        DEEPCLAW_LLM_PROVIDER: 'deepseek',
        DEEPCLAW_LLM_MODEL: 'deepseek-chat',
        DEEPCLAW_LLM_API_KEY: 'test-key',
      });

      expect(config.llm).toBeDefined();
      expect(config.llm?.provider).toBe('deepseek');
      expect(config.llm?.model).toBe('deepseek-chat');
      expect(config.llm?.apiKey).toBe('test-key');
    });
  });
});
