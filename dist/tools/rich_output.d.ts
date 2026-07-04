/**
 * Rich CLI Output Module
 *
 * Provides rich console output with progress bars, colors, and formatted tables.
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
import { Ora } from 'ora';
/**
 * Output verbosity levels
 */
export declare enum OutputLevel {
    QUIET = 0,
    NORMAL = 1,
    VERBOSE = 2,
    DEBUG = 3
}
/**
 * CLI output configuration
 */
export interface CLIConfig {
    outputLevel: OutputLevel;
    useColors: boolean;
    useProgress: boolean;
    showTimestamps: boolean;
    width: number;
}
export declare const defaultCLIConfig: CLIConfig;
/**
 * Rich console output manager
 */
export declare class RichConsole {
    config: CLIConfig;
    constructor(config?: CLIConfig);
    /**
     * Print a message with style
     */
    print(message: string, style?: string, level?: OutputLevel): void;
    /**
     * Print success message
     */
    printSuccess(message: string): void;
    /**
     * Print error message
     */
    printError(message: string): void;
    /**
     * Print warning message
     */
    printWarning(message: string): void;
    /**
     * Print info message
     */
    printInfo(message: string): void;
    /**
     * Print debug message
     */
    printDebug(message: string): void;
    /**
     * Print a section header
     */
    printHeader(title: string): void;
    /**
     * Print data as a table
     */
    printTable(data: Array<Record<string, unknown>>, title?: string): void;
    /**
     * Print content in a panel style
     */
    printPanel(content: string, title?: string, style?: string): void;
    /**
     * Create a spinner progress
     */
    createSpinner(description?: string): Ora;
    /**
     * Start progress with spinner
     */
    startProgress(description: string): Ora;
    /**
     * Stop spinner with success
     */
    stopProgressSuccess(spinner: Ora, message: string): void;
    /**
     * Stop spinner with failure
     */
    stopProgressFailure(spinner: Ora, message: string): void;
}
/**
 * Get global console instance
 */
export declare function getConsole(config?: CLIConfig): RichConsole;
/**
 * Set verbose mode
 */
export declare function setVerbose(verbose: boolean): void;
/**
 * Set quiet mode
 */
export declare function setQuiet(quiet: boolean): void;
declare const _default: {
    OutputLevel: typeof OutputLevel;
    CLIConfig: CLIConfig;
    RichConsole: typeof RichConsole;
    getConsole: typeof getConsole;
    setVerbose: typeof setVerbose;
    setQuiet: typeof setQuiet;
};
export default _default;
//# sourceMappingURL=rich_output.d.ts.map