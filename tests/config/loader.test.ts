import { describe, it, expect, vi } from 'vitest';
import { loadConfigFile, mergeConfig, loadFullConfig } from '../../src/config/loader.js';
import type { DeepClawConfig } from '../../src/types/index.js';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  access: vi.fn(),
}));

describe('Config Loader', () => {
  describe('loadConfigFile', () => {
    it('should return null when no config file exists', async () => {
      const { access } = await import('fs/promises');
      vi.mocked(access).mockRejectedValue(new Error('Not found'));

      const config = await loadConfigFile('/tmp/nonexistent');
      expect(config).toBeNull();
    });
  });

  describe('mergeConfig', () => {
    it('should use defaults when no config provided', () => {
      const config = mergeConfig(null, {});

      expect(config.defaultEngine).toBe('duckduckgo');
      expect(config.maxResults).toBe(50);
      expect(config.timeout).toBe(30000);
      expect(config.outputFormat).toBe('markdown');
    });

    it('should merge file config with defaults', () => {
      const fileConfig = {
        search: {
          defaultProvider: 'google',
          maxResults: 100,
        },
        cache: {
          enabled: true,
          ttl: 7200,
        },
      };

      const config = mergeConfig(fileConfig, {});

      expect(config.defaultEngine).toBe('google');
      expect(config.maxResults).toBe(100);
      expect(config.cache?.enabled).toBe(true);
      expect(config.cache?.ttl).toBe(7200);
    });

    it('should prioritize env config over file config', () => {
      const fileConfig = {
        search: {
          defaultProvider: 'google',
          maxResults: 100,
        },
      };

      const envConfig = {
        defaultEngine: 'bing' as const,
        maxResults: 20,
      };

      const config = mergeConfig(fileConfig, envConfig);

      expect(config.defaultEngine).toBe('bing');
      expect(config.maxResults).toBe(20);
    });

    it('should include API config', () => {
      const fileConfig = {
        api: {
          port: 8080,
          host: '0.0.0.0',
        },
      };

      const config = mergeConfig(fileConfig, {});

      expect(config.api?.port).toBe(8080);
      expect(config.api?.host).toBe('0.0.0.0');
    });

    it('should include logging config', () => {
      const fileConfig = {
        logging: {
          level: 'debug' as const,
          format: 'json' as const,
        },
      };

      const config = mergeConfig(fileConfig, {});

      expect(config.logging?.level).toBe('debug');
      expect(config.logging?.format).toBe('json');
    });
  });

  describe('loadFullConfig', () => {
    it('should load config from environment', async () => {
      const originalEngine = process.env.DEEPCLAW_ENGINE;
      const originalMaxResults = process.env.DEEPCLAW_MAX_RESULTS;

      process.env.DEEPCLAW_ENGINE = 'bing';
      process.env.DEEPCLAW_MAX_RESULTS = '30';

      const config = await loadFullConfig('/tmp/nonexistent');

      expect(config.defaultEngine).toBe('bing');
      expect(config.maxResults).toBe(30);

      process.env.DEEPCLAW_ENGINE = originalEngine;
      process.env.DEEPCLAW_MAX_RESULTS = originalMaxResults;
    });
  });
});
