/**
 * Configuration file loader
 * Supports YAML and JSON configuration files
 */
import { parse as parseYaml } from 'yaml';
import { readFile, access } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
const CONFIG_FILE_NAMES = [
    'deepclaw.yaml',
    'deepclaw.yml',
    'deepclaw.json',
];
const GLOBAL_CONFIG_PATHS = [
    join(homedir(), '.deepclaw', 'config.yaml'),
    join(homedir(), '.deepclaw', 'config.yml'),
    join(homedir(), '.deepclaw', 'config.json'),
];
/**
 * Find and load configuration file
 */
export async function loadConfigFile(cwd = process.cwd()) {
    // Try local config files first
    for (const name of CONFIG_FILE_NAMES) {
        const path = join(cwd, name);
        const config = await tryLoadFile(path);
        if (config)
            return config;
    }
    // Try global config files
    for (const path of GLOBAL_CONFIG_PATHS) {
        const config = await tryLoadFile(path);
        if (config)
            return config;
    }
    return null;
}
async function tryLoadFile(path) {
    try {
        await access(path);
        const content = await readFile(path, 'utf-8');
        if (path.endsWith('.json')) {
            return JSON.parse(content);
        }
        else {
            return parseYaml(content);
        }
    }
    catch {
        return null;
    }
}
/**
 * Merge config file with defaults
 */
export function mergeConfig(fileConfig, envConfig) {
    return {
        defaultEngine: envConfig.defaultEngine ??
            fileConfig?.search?.defaultProvider ??
            'duckduckgo',
        maxResults: envConfig.maxResults ?? fileConfig?.search?.maxResults ?? 50,
        timeout: envConfig.timeout ?? fileConfig?.search?.timeout ?? 30000,
        outputFormat: envConfig.outputFormat ??
            fileConfig?.output?.format ??
            'markdown',
        llm: envConfig.llm,
        api: {
            port: fileConfig?.api?.port ?? 3000,
            host: fileConfig?.api?.host ?? 'localhost',
        },
        cache: {
            enabled: fileConfig?.cache?.enabled ?? false,
            ttl: fileConfig?.cache?.ttl ?? 3600,
            maxSize: fileConfig?.cache?.maxSize ?? 100,
        },
        logging: {
            level: fileConfig?.logging?.level ?? 'info',
            format: fileConfig?.logging?.format ?? 'text',
        },
    };
}
/**
 * Load full configuration (file + env + defaults)
 */
export async function loadFullConfig(cwd) {
    const fileConfig = await loadConfigFile(cwd);
    const envConfig = {};
    // Load from environment
    if (process.env.DEEPCLAW_ENGINE) {
        envConfig.defaultEngine = process.env.DEEPCLAW_ENGINE;
    }
    if (process.env.DEEPCLAW_MAX_RESULTS) {
        envConfig.maxResults = parseInt(process.env.DEEPCLAW_MAX_RESULTS, 10);
    }
    if (process.env.DEEPCLAW_TIMEOUT) {
        envConfig.timeout = parseInt(process.env.DEEPCLAW_TIMEOUT, 10);
    }
    if (process.env.DEEPCLAW_OUTPUT_FORMAT) {
        envConfig.outputFormat = process.env.DEEPCLAW_OUTPUT_FORMAT;
    }
    if (process.env.DEEPCLAW_LLM_PROVIDER) {
        envConfig.llm = {
            provider: process.env.DEEPCLAW_LLM_PROVIDER,
            model: process.env.DEEPCLAW_LLM_MODEL,
            apiKey: process.env.DEEPCLAW_LLM_API_KEY,
        };
    }
    return mergeConfig(fileConfig, envConfig);
}
//# sourceMappingURL=loader.js.map