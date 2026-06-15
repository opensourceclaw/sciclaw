/**
 * CLI entry point for DeepClaw
 */
import { Command } from 'commander';
import { VERSION } from '../index.js';
import { searchCommand } from './commands/search.js';
import { researchCommand } from './commands/research.js';
import { reportCommand } from './commands/report.js';
import { serveCommand } from './commands/serve.js';
const program = new Command();
program
    .name('deepclaw')
    .description('Deep Research Framework - AI-powered multi-source research and synthesis')
    .version(VERSION);
// Register commands
program.addCommand(searchCommand);
program.addCommand(researchCommand);
program.addCommand(reportCommand);
program.addCommand(serveCommand);
export function run() {
    program.parse(process.argv);
}
// Auto-run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    run();
}
//# sourceMappingURL=index.js.map