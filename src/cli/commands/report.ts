/**
 * Report command - Generate research report
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { generateReport } from '../../report/index.js';
import type { ReportOptions } from '../../types/index.js';

export const reportCommand = new Command('report')
  .description('Generate research report')
  .argument('[id]', 'Research ID')
  .option('-f, --format <format>', 'Output format (markdown, html, pdf)', 'markdown')
  .option('-o, --output <path>', 'Output file path')
  .action(async (id: string | undefined, options) => {
    const spinner = ora('Generating report...').start();

    try {
      const reportOptions: ReportOptions = {
        format: options.format as 'markdown' | 'html' | 'pdf',
        outputPath: options.output,
      };

      const report = await generateReport(id, reportOptions);

      spinner.succeed('Report generated');

      if (options.output) {
        console.log(chalk.green(`Report saved to: ${options.output}`));
      } else {
        console.log();
        console.log(chalk.bold(`Report: ${report.title}`));
        console.log(report.content);
      }
    } catch (error) {
      spinner.fail('Report generation failed');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });
