import { describe, it, expect } from "vitest";
import {
  DeepResearchGateStrategy,
  AutoResearchGateStrategy,
  createGateStrategy,
} from "../../src/gate/gate-strategy.js";

describe("GateStrategy", () => {
  describe("DeepResearchGateStrategy", () => {
    const strategy = new DeepResearchGateStrategy();

    it("should require approval for all stages", () => {
      expect(strategy.name).toBe("deep-research");
      expect(strategy.shouldApprove("PLAN")).toBe(false);
      expect(strategy.shouldApprove("SEARCH")).toBe(false);
      expect(strategy.shouldApprove("ANALYZE")).toBe(false);
      expect(strategy.shouldApprove("SYNTHESIZE")).toBe(false);
      expect(strategy.shouldApprove("REPORT")).toBe(false);
    });

    it("should have all gates", () => {
      const gates = strategy.getGates();
      expect(gates.length).toBe(5);
      expect(gates.every(g => g.required)).toBe(true);
    });

    it("should return false from execute (requires human)", async () => {
      const result = await strategy.execute("PLAN");
      expect(result).toBe(false);
    });
  });

  describe("AutoResearchGateStrategy", () => {
    const strategy = new AutoResearchGateStrategy();

    it("should auto-approve all stages", () => {
      expect(strategy.name).toBe("auto-research");
      expect(strategy.shouldApprove("PLAN")).toBe(true);
      expect(strategy.shouldApprove("SEARCH")).toBe(true);
      expect(strategy.shouldApprove("ANALYZE")).toBe(true);
    });

    it("should have auto-approved gates", () => {
      const gates = strategy.getGates();
      expect(gates.length).toBe(5);
      expect(gates.every(g => !g.required)).toBe(true);
    });

    it("should return true from execute (auto-approved)", async () => {
      const result = await strategy.execute("SEARCH");
      expect(result).toBe(true);
    });
  });

  describe("createGateStrategy", () => {
    it("should return DeepResearchGateStrategy for deep mode", () => {
      const strategy = createGateStrategy("deep");
      expect(strategy.name).toBe("deep-research");
    });

    it("should return AutoResearchGateStrategy for auto mode", () => {
      const strategy = createGateStrategy("auto");
      expect(strategy.name).toBe("auto-research");
    });
  });
});
