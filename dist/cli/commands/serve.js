/**
 * Serve command - Start API server
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { createServer } from '../../api/index.js';
export const serveCommand = new Command('serve')
    .description('Start API server')
    .option('-p, --port <port>', 'Server port', '3000')
    .option('-h, --host <host>', 'Server host', 'localhost')
    .action(async (options) => {
    const port = parseInt(options.port, 10);
    try {
        const server = await createServer({ port, host: options.host });
        console.log(chalk.green(`DeepClaw API server running at http://${options.host}:${port}`));
        console.log();
        console.log('Endpoints:');
        console.log(`  POST /api/search     - Search across sources`);
        console.log(`  POST /api/research   - Deep research`);
        console.log(`  GET  /api/report/:id - Get report`);
        console.log(`  POST /api/report/:id - Generate report`);
        console.log(`  GET  /api/status     - Server status`);
        await server.listen();
    }
    catch (error) {
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
    }
});
//# sourceMappingURL=serve.js.map