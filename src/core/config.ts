/**
 * SciClaw configuration
 */

import { z } from 'zod';
import type { SciClawConfig } from './types/index.js';

const configSchema = z.object({
  defaultEngine: z.enum(['duckduckgo', 'google', 'bing']).default('duckduckgo'),
  maxResults: z.number().min(1).max(100).default(50),
  timeout: z.number().min(1000).max(300000).default(30000),
  outputFormat: z.enum(['markdown', 'html', 'pdf']).default('markdown'),
  llm: z
    .object({
      provider: z.string(),
      model: z.string().optional(),
      apiKey: z.string().optional(),
    })
    .optional(),
});

export function loadConfig(env: Record<string, string | undefined> = process.env): SciClawConfig {
  return configSchema.parse({
    defaultEngine: env.DEEPCLAW_ENGINE,
    maxResults: env.DEEPCLAW_MAX_RESULTS ? parseInt(env.DEEPCLAW_MAX_RESULTS, 10) : undefined,
    timeout: env.DEEPCLAW_TIMEOUT ? parseInt(env.DEEPCLAW_TIMEOUT, 10) : undefined,
    outputFormat: env.DEEPCLAW_OUTPUT_FORMAT,
    llm: env.DEEPCLAW_LLM_PROVIDER
      ? {
          provider: env.DEEPCLAW_LLM_PROVIDER,
          model: env.DEEPCLAW_LLM_MODEL,
          apiKey: env.DEEPCLAW_LLM_API_KEY,
        }
      : undefined,
  });
}

export const defaultConfig: SciClawConfig = {
  defaultEngine: 'duckduckgo',
  maxResults: 50,
  timeout: 30000,
  outputFormat: 'markdown',
};
