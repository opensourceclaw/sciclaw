/**
 * API module - REST API server
 */
export interface ServerOptions {
    port: number;
    host: string;
}
export declare function createServer(options: ServerOptions): Promise<{
    listen: () => Promise<void>;
    close: () => void;
}>;
export { createServer as default };
//# sourceMappingURL=index.d.ts.map