/**
 * Rich CLI Output Module
 *
 * Provides rich console output with progress bars, colors, and formatted tables.
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
import chalk from 'chalk';
import ora from 'ora';
/**
 * Output verbosity levels
 */
export var OutputLevel;
(function (OutputLevel) {
    OutputLevel[OutputLevel["QUIET"] = 0] = "QUIET";
    OutputLevel[OutputLevel["NORMAL"] = 1] = "NORMAL";
    OutputLevel[OutputLevel["VERBOSE"] = 2] = "VERBOSE";
    OutputLevel[OutputLevel["DEBUG"] = 3] = "DEBUG";
})(OutputLevel || (OutputLevel = {}));
export const defaultCLIConfig = {
    outputLevel: OutputLevel.NORMAL,
    useColors: true,
    useProgress: true,
    showTimestamps: false,
    width: 80,
};
/**
 * Rich console output manager
 */
export class RichConsole {
    config;
    constructor(config) {
        this.config = config || defaultCLIConfig;
    }
    /**
     * Print a message with style
     */
    print(message, style = "info", level) {
        level = level ?? this.config.outputLevel;
        if (level > this.config.outputLevel) {
            return;
        }
        if (!this.config.useColors) {
            // Basic output without colors
            let prefix = "";
            switch (style) {
                case "success":
                    prefix = "✓ ";
                    break;
                case "error":
                    prefix = "✗ ";
                    break;
                case "warning":
                    prefix = "⚠ ";
                    break;
            }
            console.log(`${prefix}${message}`);
            return;
        }
        // Colored output using chalk
        switch (style) {
            case "success":
                console.log(chalk.green(`✓ ${message}`));
                break;
            case "error":
                console.log(chalk.red.bold(`✗ ${message}`));
                break;
            case "warning":
                console.log(chalk.yellow(`⚠ ${message}`));
                break;
            case "info":
                console.log(chalk.blue(message));
                break;
            case "debug":
                console.log(chalk.dim(message));
                break;
            case "highlight":
                console.log(chalk.cyan(message));
                break;
            default:
                console.log(message);
        }
    }
    /**
     * Print success message
     */
    printSuccess(message) {
        this.print(message, "success");
    }
    /**
     * Print error message
     */
    printError(message) {
        this.print(message, "error");
    }
    /**
     * Print warning message
     */
    printWarning(message) {
        this.print(message, "warning");
    }
    /**
     * Print info message
     */
    printInfo(message) {
        this.print(message, "info");
    }
    /**
     * Print debug message
     */
    printDebug(message) {
        this.print(message, "debug", OutputLevel.DEBUG);
    }
    /**
     * Print a section header
     */
    printHeader(title) {
        if (!this.config.useColors) {
            console.log("\n" + "=".repeat(40));
            console.log(`  ${title}`);
            console.log("=".repeat(40) + "\n");
            return;
        }
        console.log("\n" + chalk.cyan.bold("=".repeat(40)));
        console.log(chalk.cyan.bold(`  ${title}`));
        console.log(chalk.cyan.bold("=".repeat(40)) + "\n");
    }
    /**
     * Print data as a table
     */
    printTable(data, title) {
        if (data.length === 0)
            return;
        if (!this.config.useColors) {
            // Basic table output
            if (title) {
                console.log(`\n${title}`);
                console.log("-".repeat(40));
            }
            const keys = Object.keys(data[0] || {});
            console.log(keys.join(" | "));
            for (const row of data) {
                console.log(keys.map(k => String(row[k] || "")).join(" | "));
            }
            return;
        }
        // Colored table
        if (title) {
            console.log(chalk.cyan.bold(`\n${title}`));
        }
        const firstRow = data[0] || {};
        const keys = Object.keys(firstRow);
        const header = keys.map(k => chalk.magenta.bold(k.replace(/_/g, " ").toUpperCase()));
        console.log(header.join(" | "));
        for (const row of data) {
            const values = keys.map(k => chalk.cyan(String(row[k] || "")));
            console.log(values.join(" | "));
        }
    }
    /**
     * Print content in a panel style
     */
    printPanel(content, title, style = "info") {
        if (!this.config.useColors) {
            if (title)
                console.log(`\n--- ${title} ---`);
            console.log(content);
            console.log("-".repeat(40));
            return;
        }
        const borderColor = style === "error" ? chalk.red : style === "success" ? chalk.green : chalk.blue;
        const line = borderColor("-".repeat(40));
        if (title) {
            console.log("\n" + line);
            console.log(chalk.bold(`  ${title}`));
        }
        console.log(line);
        console.log(content);
        console.log(line);
    }
    /**
     * Create a spinner progress
     */
    createSpinner(description = "Processing...") {
        return ora({
            text: description,
            spinner: "dots",
            color: "cyan",
        }).start();
    }
    /**
     * Start progress with spinner
     */
    startProgress(description) {
        return this.createSpinner(description);
    }
    /**
     * Stop spinner with success
     */
    stopProgressSuccess(spinner, message) {
        spinner.succeed(message);
    }
    /**
     * Stop spinner with failure
     */
    stopProgressFailure(spinner, message) {
        spinner.fail(message);
    }
}
// Global console instance
let globalConsole = null;
/**
 * Get global console instance
 */
export function getConsole(config) {
    if (!globalConsole || config) {
        globalConsole = new RichConsole(config);
    }
    return globalConsole;
}
/**
 * Set verbose mode
 */
export function setVerbose(verbose) {
    const console = getConsole();
    console.config.outputLevel = verbose ? OutputLevel.VERBOSE : OutputLevel.NORMAL;
}
/**
 * Set quiet mode
 */
export function setQuiet(quiet) {
    const console = getConsole();
    console.config.outputLevel = quiet ? OutputLevel.QUIET : OutputLevel.NORMAL;
}
// Export all
export default {
    OutputLevel,
    CLIConfig: defaultCLIConfig,
    RichConsole,
    getConsole,
    setVerbose,
    setQuiet,
};
//# sourceMappingURL=rich_output.js.map