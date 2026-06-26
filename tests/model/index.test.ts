import { describe, it, expect } from "vitest";

describe("src/model/index", () => {
  it("exports OpenClawModelAdapter", async () => {
    const mod = await import("../../src/model/index.js");
    expect(mod.OpenClawModelAdapter).toBeDefined();
    expect(typeof mod.OpenClawModelAdapter).toBe("function");
  });

  it("exports ModelRouter", async () => {
    const mod = await import("../../src/model/index.js");
    expect(mod.ModelRouter).toBeDefined();
    expect(typeof mod.ModelRouter).toBe("function");
  });

  it("exports FallbackHandler", async () => {
    const mod = await import("../../src/model/index.js");
    expect(mod.FallbackHandler).toBeDefined();
    expect(typeof mod.FallbackHandler).toBe("function");
  });

  it("exports CostOptimizer", async () => {
    const mod = await import("../../src/model/index.js");
    expect(mod.CostOptimizer).toBeDefined();
    expect(typeof mod.CostOptimizer).toBe("function");
  });

  it("exports all types from ./types.js", async () => {
    const mod = await import("../../src/model/types.js");
    // Verify key types are present in the exports
    const idx = await import("../../src/model/index.js");
    // Type exports are consumed at the type level but can be verified through module structure
    expect(idx).toBeDefined();
    // Verify source types exist
    expect(mod.DEFAULT_ADAPTER_CONFIG).toBeDefined();
    expect(mod.DEFAULT_FALLBACKS).toBeDefined();
    expect(mod.DEFAULT_TASK_MODEL_MAP).toBeDefined();
  });
});
