import { describe, it, expect } from "vitest";
import {
  CausalAnalyzer,
  createCausalAnalyzer,
} from "../../src/reasoning/causal.js";
import { CausalRelationType } from "../../src/reasoning/types.js";

describe("CausalAnalyzer", () => {
  let analyzer: CausalAnalyzer;

  beforeEach(() => {
    analyzer = createCausalAnalyzer();
  });

  describe("analyzeCausal / buildGraph", () => {
    it("builds graph from entities with relations", () => {
      const entities = [
        { name: "Smoking", relations: [{ target: "Cancer", type: "causes" }] },
      ];
      const graph = analyzer.analyzeCausal(entities);
      expect(graph.nodes).toHaveLength(2);
      expect(graph.edges).toHaveLength(1);
    });

    it("classifies cause nodes correctly", () => {
      const entities = [
        { name: "Smoking", relations: [{ target: "Cancer", type: "causes" }] },
      ];
      const graph = analyzer.analyzeCausal(entities);
      const smoking = graph.nodes.find((n) => n.entity === "Smoking");
      expect(smoking?.type).toBe("cause");
    });

    it("classifies effect nodes correctly", () => {
      const entities = [
        { name: "Smoking", relations: [{ target: "Cancer", type: "causes" }] },
      ];
      const graph = analyzer.analyzeCausal(entities);
      const cancer = graph.nodes.find((n) => n.entity === "Cancer");
      expect(cancer?.type).toBe("effect");
    });

    it("classifies mediator nodes", () => {
      const entities = [
        {
          name: "Smoking",
          relations: [{ target: "Inflammation", type: "causes" }],
        },
        {
          name: "Inflammation",
          relations: [{ target: "Cancer", type: "causes" }],
        },
      ];
      const graph = analyzer.analyzeCausal(entities);
      const inflammation = graph.nodes.find((n) => n.entity === "Inflammation");
      expect(inflammation?.type).toBe("mediator");
    });

    it("classifies confounder nodes", () => {
      // Smoking → (Cancer, HeartDisease) + both Cancer and HeartDisease share an effect
      const entities = [
        {
          name: "Smoking",
          relations: [
            { target: "Cancer", type: "causes" },
            { target: "HeartDisease", type: "causes" },
            { target: "Stroke", type: "causes" },
          ],
        },
        {
          name: "Cancer",
          relations: [{ target: "Death", type: "causes" }],
        },
        {
          name: "HeartDisease",
          relations: [{ target: "Death", type: "causes" }],
        },
      ];
      const graph = analyzer.analyzeCausal(entities);
      const smoking = graph.nodes.find((n) => n.entity === "Smoking");
      // Smoking has >2 outgoing edges and its targets (Cancer, HeartDisease) share Death as effect
      expect(smoking?.type).toBe("confounder");
    });

    it("maps relation types correctly", () => {
      const entities = [
        { name: "A", relations: [{ target: "B", type: "causes" }] },
      ];
      const graph = analyzer.analyzeCausal(entities);
      expect(graph.edges[0]!.relation).toBe(CausalRelationType.CAUSES);
      expect(graph.edges[0]!.strength).toBe(0.7);
    });

    it("maps 'leads_to' to CAUSES", () => {
      const entities = [
        { name: "A", relations: [{ target: "B", type: "leads_to" }] },
      ];
      const graph = analyzer.analyzeCausal(entities);
      expect(graph.edges[0]!.relation).toBe(CausalRelationType.CAUSES);
    });

    it("maps 'prevents' to PREVENTS", () => {
      const entities = [
        { name: "A", relations: [{ target: "B", type: "prevents" }] },
      ];
      const graph = analyzer.analyzeCausal(entities);
      expect(graph.edges[0]!.relation).toBe(CausalRelationType.PREVENTS);
    });

    it("maps 'enables' to ENABLES", () => {
      const entities = [
        { name: "A", relations: [{ target: "B", type: "enables" }] },
      ];
      const graph = analyzer.analyzeCausal(entities);
      expect(graph.edges[0]!.relation).toBe(CausalRelationType.ENABLES);
    });

    it("maps unknown type to CORRELATES_WITH with low strength", () => {
      const entities = [
        { name: "A", relations: [{ target: "B", type: "unknown_relation" }] },
      ];
      const graph = analyzer.analyzeCausal(entities);
      expect(graph.edges[0]!.relation).toBe(CausalRelationType.CORRELATES_WITH);
      expect(graph.edges[0]!.strength).toBe(0.3);
    });
  });

  describe("findRootCauses", () => {
    it("identifies root cause nodes", () => {
      const entities = [
        { name: "Root", relations: [{ target: "Middle", type: "causes" }] },
        {
          name: "Middle",
          relations: [{ target: "Leaf", type: "causes" }],
        },
      ];
      const graph = analyzer.analyzeCausal(entities);
      const roots = analyzer.findRootCauses(graph);
      expect(roots).toHaveLength(1);
      expect(roots[0]!.entity).toBe("Root");
    });
  });

  describe("findPaths", () => {
    it("finds causal path between two nodes", () => {
      const entities = [
        { name: "A", relations: [{ target: "B", type: "causes" }] },
        { name: "B", relations: [{ target: "C", type: "causes" }] },
      ];
      const graph = analyzer.analyzeCausal(entities);
      const aNode = graph.nodes.find((n) => n.entity === "A")!;
      const cNode = graph.nodes.find((n) => n.entity === "C")!;

      const paths = analyzer.findPaths(graph, aNode.id, cNode.id);
      expect(paths).toHaveLength(1);
      expect(paths[0]!.nodes).toHaveLength(3);
      expect(paths[0]!.length).toBe(2);
    });

    it("finds strongest path among multiple", () => {
      const entities = [
        { name: "A", relations: [{ target: "B", type: "causes" }] },
        { name: "A", relations: [{ target: "C", type: "causes" }] },
        { name: "B", relations: [{ target: "D", type: "causes" }] },
        { name: "C", relations: [{ target: "D", type: "enables" }] },
      ];
      const graph = analyzer.analyzeCausal(entities);
      const aNode = graph.nodes.find((n) => n.entity === "A")!;
      const dNode = graph.nodes.find((n) => n.entity === "D")!;

      const strongest = analyzer.findStrongestPath(graph, aNode.id, dNode.id);
      expect(strongest).not.toBeNull();
      // Both paths have same strengths (0.7 * 0.7 = 0.49), sorted by order found
      expect(strongest!.length).toBe(2);
    });

    it("returns empty array for disconnected nodes", () => {
      const entities = [
        { name: "A", relations: [] },
        { name: "B", relations: [] },
      ];
      const graph = analyzer.analyzeCausal(entities);
      const aNode = graph.nodes.find((n) => n.entity === "A")!;
      const bNode = graph.nodes.find((n) => n.entity === "B")!;

      const paths = analyzer.findPaths(graph, aNode.id, bNode.id);
      expect(paths).toEqual([]);
    });

    it("returns null from findStrongestPath when no path exists", () => {
      const entities = [
        { name: "A", relations: [] },
        { name: "B", relations: [] },
      ];
      const graph = analyzer.analyzeCausal(entities);
      const aNode = graph.nodes.find((n) => n.entity === "A")!;
      const bNode = graph.nodes.find((n) => n.entity === "B")!;

      expect(analyzer.findStrongestPath(graph, aNode.id, bNode.id)).toBeNull();
    });
  });

  describe("graph queries", () => {
    it("getDownstreamEffects returns all downstream nodes", () => {
      const entities = [
        { name: "A", relations: [{ target: "B", type: "causes" }] },
        { name: "B", relations: [{ target: "C", type: "causes" }] },
      ];
      const graph = analyzer.analyzeCausal(entities);
      const aNode = graph.nodes.find((n) => n.entity === "A")!;

      const downstream = analyzer.getDownstreamEffects(graph, aNode.id);
      expect(downstream).toHaveLength(2);
      const names = downstream.map((n) => n.entity);
      expect(names).toContain("B");
      expect(names).toContain("C");
    });

    it("getUpstreamCauses returns all upstream nodes", () => {
      const entities = [
        { name: "A", relations: [{ target: "B", type: "causes" }] },
        { name: "B", relations: [{ target: "C", type: "causes" }] },
      ];
      const graph = analyzer.analyzeCausal(entities);
      const cNode = graph.nodes.find((n) => n.entity === "C")!;

      const upstream = analyzer.getUpstreamCauses(graph, cNode.id);
      expect(upstream).toHaveLength(2);
      const names = upstream.map((n) => n.entity);
      expect(names).toContain("A");
      expect(names).toContain("B");
    });

    it("getMediators returns mediator nodes", () => {
      const entities = [
        { name: "A", relations: [{ target: "B", type: "causes" }] },
        { name: "B", relations: [{ target: "C", type: "causes" }] },
      ];
      const graph = analyzer.analyzeCausal(entities);
      const mediators = analyzer.getMediators(graph);
      expect(mediators).toHaveLength(1);
      expect(mediators[0]!.entity).toBe("B");
    });
  });

  describe("edge cases", () => {
    it("handles empty entities", () => {
      const graph = analyzer.analyzeCausal([]);
      expect(graph.nodes).toEqual([]);
      expect(graph.edges).toEqual([]);
      expect(graph.rootCauses).toEqual([]);
      expect(graph.leafEffects).toEqual([]);
    });

    it("handles single entity with no relations", () => {
      const entities = [{ name: "Solo", relations: [] }];
      const graph = analyzer.analyzeCausal(entities);
      expect(graph.nodes).toHaveLength(1);
      expect(graph.edges).toHaveLength(0);
      expect(graph.nodes[0]!.entity).toBe("Solo");
    });

    it("skips self-referencing relations", () => {
      const entities = [
        { name: "A", relations: [{ target: "A", type: "causes" }] },
      ];
      const graph = analyzer.analyzeCausal(entities);
      expect(graph.edges).toHaveLength(0);
    });

    it("handles cyclic graph", () => {
      const entities = [
        { name: "A", relations: [{ target: "B", type: "causes" }] },
        { name: "B", relations: [{ target: "A", type: "causes" }] },
      ];
      const graph = analyzer.analyzeCausal(entities);
      expect(graph.nodes).toHaveLength(2);
      expect(graph.edges).toHaveLength(2);
      // In a cycle, all nodes are mediators
      expect(graph.nodes.every((n) => n.type === "mediator")).toBe(true);
    });
  });

  describe("addNode / addEdge", () => {
    it("addNode appends to graph", () => {
      const entities = [{ name: "A", relations: [] }];
      const graph = analyzer.analyzeCausal(entities);
      const updated = analyzer.addNode(graph, {
        id: "new-id",
        entity: "B",
        type: "effect",
      });
      expect(updated.nodes).toHaveLength(2);
    });

    it("addEdge updates rootCauses and leafEffects", () => {
      const entities = [
        { name: "A", relations: [] },
        { name: "B", relations: [] },
      ];
      let graph = analyzer.analyzeCausal(entities);
      const aNode = graph.nodes.find((n) => n.entity === "A")!;
      const bNode = graph.nodes.find((n) => n.entity === "B")!;

      graph = analyzer.addEdge(graph, {
        id: "edge-1",
        source: aNode.id,
        target: bNode.id,
        relation: CausalRelationType.CAUSES,
        strength: 0.7,
        evidence: [],
      });

      expect(graph.edges).toHaveLength(1);
      expect(graph.rootCauses).toContain(aNode.id);
      expect(graph.leafEffects).toContain(bNode.id);
    });
  });

  describe("exportGraph", () => {
    it("returns nodes and edges", () => {
      const entities = [
        { name: "A", relations: [{ target: "B", type: "causes" }] },
      ];
      const graph = analyzer.analyzeCausal(entities);
      const exported = analyzer.exportGraph(graph);
      expect(exported.nodes).toHaveLength(2);
      expect(exported.edges).toHaveLength(1);
    });
  });
});
