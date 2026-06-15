/**
 * Research command - Deep research on a topic
 */
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { conductResearch } from '../../research/index.js';
export const researchCommand = new Command('research')
    .description('Deep research on a topic')
    .argument('<topic>', 'Research topic')
    .option('-d, --depth <level>', 'Research depth (shallow, medium, deep)', 'medium')
    .option('-o, --output <path>', 'Output file path')
    .option('-f, --format <format>', 'Output format (markdown, html, pdf)', 'markdown')
    .option('-s, --sources <sources>', 'Comma-separated list of sources')
    .action(async (topic, options) => {
    const spinner = ora(`Researching: ${topic}...`).start();
    try {
        const researchOptions = {
            topic,
            depth: options.depth,
            outputFormat: options.format,
            sources: options.sources?.split(','),
        };
        const result = await conductResearch(researchOptions);
        spinner.succeed('Research complete');
        if (options.output) {
            const fs = await import('fs/promises');
            await fs.writeFile(options.output, result.summary);
            console.log(chalk.green(`Report saved to: ${options.output}`));
        }
        else {
            console.log();
            console.log(chalk.bold('Summary:'));
            console.log(result.summary);
        }
    }
    catch (error) {
        spinner.fail('Research failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
    }
});
//# sourceMappingURL=research.js.map