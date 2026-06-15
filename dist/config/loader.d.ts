/**
 * Configuration file loader
 * Supports YAML and JSON configuration files
 */
import type { DeepClawConfig } from '../types/index.js';
export interface ConfigFile {
    search?: {
        defaultProvider?: string;
        maxResults?: number;
        timeout?: number;
    };
    api?: {
        port?: number;
        host?: string;
    };
    output?: {
        format?: string;
        pdf?: {
            pageSize?: string;
            margin?: number;
        };
    };
    cache?: {
        enabled?: boolean;
        ttl?: number;
        maxSize?: number;
    };
    logging?: {
        level?: 'debug' | 'info' | 'warn' | 'error';
        format?: 'json' | 'text';
    };
}
/**
 * Find and load configuration file
 */
export declare function loadConfigFile(cwd?: string): Promise<ConfigFile | null>;
/**
 * Merge config file with defaults
 */
export declare function mergeConfig(fileConfig: ConfigFile | null, envConfig: Partial<DeepClawConfig>): DeepClawConfig;
/**
 * Load full configuration (file + env + defaults)
 */
export declare function loadFullConfig(cwd?: string): Promise<DeepClawConfig>;
//# sourceMappingURL=loader.d.ts.map