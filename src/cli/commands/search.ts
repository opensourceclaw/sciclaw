/**
 * Search command - Search across multiple sources
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { search } from '../../search/index.js';
import type { SearchOptions, SearchResult } from '../../types/index.js';

export const searchCommand = new Command('search')
  .description('Search across multiple sources')
  .argument('<query>', 'Search query')
  .option('-e, --engine <engine>', 'Search engine (duckduckgo, google, bing)', 'duckduckgo')
  .option('-n, --max-results <number>', 'Maximum number of results', '20')
  .option('-j, --json', 'Output as JSON', false)
  .option('-v, --verbose', 'Verbose output', false)
  .action(async (query: string, options) => {
    const spinner = ora('Searching...').start();

    try {
      const searchOptions: SearchOptions = {
        query,
        engines: [options.engine],
        maxResults: parseInt(options.maxResults, 10),
      };

      const results: SearchResult[] = await search(searchOptions);

      spinner.succeed(`Found ${results.length} results`);

      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        displayResults(results, options.verbose);
      }
    } catch (error) {
      spinner.fail('Search failed');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

function displayResults(results: SearchResult[], verbose: boolean): void {
  console.log();
  results.forEach((result, index) => {
    console.log(chalk.bold(`${index + 1}. ${result.title}`));
    console.log(chalk.blue(result.url));
    if (verbose) {
      console.log(chalk.gray(result.snippet));
    }
    console.log();
  });
}
