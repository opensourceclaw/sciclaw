import type { ModelRequest, ModelResponse, ModelAdapterConfig } from "./types.js";
export declare class OpenClawModelAdapter {
    private config;
    private fetchImpl;
    constructor(config?: Partial<ModelAdapterConfig>);
    chat(request: ModelRequest): Promise<ModelResponse>;
    chatStream(request: ModelRequest, onToken: (token: string) => void): Promise<ModelResponse>;
    healthCheck(): Promise<boolean>;
    listModels(): Promise<string[]>;
    getConfig(): ModelAdapterConfig;
    private resolveModel;
}
//# sourceMappingURL=adapter.d.ts.map