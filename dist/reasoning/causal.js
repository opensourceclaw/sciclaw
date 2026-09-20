/**
 * SciClaw v3.0.0 — Causal Analysis Engine
 *
 * Causal graph construction, path finding, and node classification.
 */
import { CausalRelationType, DEFAULT_REASONING_CONFIG, } from "./types.js";
// ── Helpers ──────────────────────────────────────────────────────────────
function generateId() {
    return crypto.randomUUID();
}
function mapRelationType(type) {
    const t = type.toLowerCase();
    if (/causes?|leads?_to|results?_in/.test(t)) {
        return { relation: CausalRelationType.CAUSES, strength: 0.7 };
    }
    if (/prevents?|blocks?|inhibits?/.test(t)) {
        return { relation: CausalRelationType.PREVENTS, strength: 0.7 };
    }
    if (/enables?|allows?|facilitates?/.test(t)) {
        return { relation: CausalRelationType.ENABLES, strength: 0.7 };
    }
    if (/inhibits?|suppresses?|reduces?/.test(t)) {
        return { relation: CausalRelationType.INHIBITS, strength: 0.7 };
    }
    // Default for unknown types
    return { relation: CausalRelationType.CORRELATES_WITH, strength: 0.3 };
}
function classifyNode(nodeId, graph) {
    const outgoing = graph.edges.filter((e) => e.source === nodeId);
    const incoming = graph.edges.filter((e) => e.target === nodeId);
    // Check confounder first: >2 outgoing to nodes that share a common effect
    if (outgoing.length > 2) {
        const targets = outgoing.map((e) => e.target);
        const sharedEffect = graph.nodes.some((n) => {
            if (n.id === nodeId)
                return false;
            const incomingToN = graph.edges.filter((e) => e.target === n.id);
            return (incomingToN.filter((e) => targets.includes(e.source)).length > 1);
        });
        if (sharedEffect)
            return "confounder";
    }
    if (incoming.length === 0 && outgoing.length > 0)
        return "cause";
    if (outgoing.length === 0 && incoming.length > 0)
        return "effect";
    if (incoming.length > 0 && outgoing.length > 0)
        return "mediator";
    return "cause";
}
// ── CausalAnalyzer ───────────────────────────────────────────────────────
export class CausalAnalyzer {
    config;
    constructor(config) {
        this.config = { ...DEFAULT_REASONING_CONFIG, ...config };
    }
    buildGraph(entities) {
        const nodeMap = new Map();
        const edges = [];
        // Create nodes
        for (const entity of entities) {
            if (!nodeMap.has(entity.name)) {
                nodeMap.set(entity.name, {
                    id: generateId(),
                    entity: entity.name,
                    type: "cause", // placeholder, classified later
                });
            }
        }
        // Create edges
        for (const entity of entities) {
            const sourceNode = nodeMap.get(entity.name);
            if (!sourceNode)
                continue;
            for (const rel of entity.relations) {
                // Skip self-referencing
                if (rel.target === entity.name)
                    continue;
                let targetNode = nodeMap.get(rel.target);
                if (!targetNode) {
                    targetNode = {
                        id: generateId(),
                        entity: rel.target,
                        type: "effect",
                    };
                    nodeMap.set(rel.target, targetNode);
                }
                const { relation, strength } = mapRelationType(rel.type);
                edges.push({
                    id: generateId(),
                    source: sourceNode.id,
                    target: targetNode.id,
                    relation,
                    strength,
                    evidence: [],
                });
            }
        }
        // Build graph first for classification
        const graph = {
            id: generateId(),
            nodes: [...nodeMap.values()],
            edges,
            rootCauses: [],
            leafEffects: [],
        };
        // Classify all nodes
        for (const node of graph.nodes) {
            node.type = classifyNode(node.id, graph);
        }
        // Identify root causes and leaf effects
        const targetIds = new Set(edges.map((e) => e.target));
        const sourceIds = new Set(edges.map((e) => e.source));
        graph.rootCauses = graph.nodes
            .filter((n) => !targetIds.has(n.id) && sourceIds.has(n.id))
            .map((n) => n.id);
        graph.leafEffects = graph.nodes
            .filter((n) => targetIds.has(n.id) && !sourceIds.has(n.id))
            .map((n) => n.id);
        // If no root causes found (all nodes have incoming edges), use nodes with no incoming
        if (graph.rootCauses.length === 0) {
            graph.rootCauses = graph.nodes
                .filter((n) => !targetIds.has(n.id))
                .map((n) => n.id);
        }
        // If no leaf effects found, use nodes with no outgoing
        if (graph.leafEffects.length === 0) {
            graph.leafEffects = graph.nodes
                .filter((n) => !sourceIds.has(n.id))
                .map((n) => n.id);
        }
        return graph;
    }
    addNode(graph, node) {
        return {
            ...graph,
            nodes: [...graph.nodes, node],
        };
    }
    addEdge(graph, edge) {
        // Recompute rootCauses/leafEffects
        const newEdges = [...graph.edges, edge];
        const targetIds = new Set(newEdges.map((e) => e.target));
        const sourceIds = new Set(newEdges.map((e) => e.source));
        return {
            ...graph,
            edges: newEdges,
            rootCauses: graph.nodes
                .filter((n) => !targetIds.has(n.id))
                .map((n) => n.id),
            leafEffects: graph.nodes
                .filter((n) => !sourceIds.has(n.id))
                .map((n) => n.id),
        };
    }
    analyzeCausal(entities) {
        if (entities.length === 0) {
            return {
                id: generateId(),
                nodes: [],
                edges: [],
                rootCauses: [],
                leafEffects: [],
            };
        }
        return this.buildGraph(entities);
    }
    findRootCauses(graph) {
        return graph.nodes.filter((n) => graph.rootCauses.includes(n.id));
    }
    findPaths(graph, fromId, toId) {
        const paths = [];
        const adjacency = new Map();
        for (const edge of graph.edges) {
            const neighbors = adjacency.get(edge.source) ?? [];
            neighbors.push([edge.target, edge]);
            adjacency.set(edge.source, neighbors);
        }
        const queue = [{ nodeId: fromId, path: [fromId], strength: 1.0 }];
        // Limit search to prevent combinatorial explosion on large graphs
        let iterations = 0;
        const maxIterations = 1000;
        while (queue.length > 0 && iterations < maxIterations) {
            iterations++;
            const current = queue.shift();
            if (current.nodeId === toId) {
                paths.push({
                    nodes: current.path,
                    totalStrength: Math.round(current.strength * 100) / 100,
                    length: current.path.length - 1,
                });
                continue;
            }
            const neighbors = adjacency.get(current.nodeId) ?? [];
            for (const [neighbor, edge] of neighbors) {
                if (!current.path.includes(neighbor)) {
                    queue.push({
                        nodeId: neighbor,
                        path: [...current.path, neighbor],
                        strength: current.strength * edge.strength,
                    });
                }
            }
        }
        return paths.sort((a, b) => b.totalStrength - a.totalStrength);
    }
    findStrongestPath(graph, fromId, toId) {
        const paths = this.findPaths(graph, fromId, toId);
        return paths.length > 0 ? (paths[0] ?? null) : null;
    }
    getDownstreamEffects(graph, nodeId) {
        const downstream = new Set();
        const adjacency = new Map();
        for (const edge of graph.edges) {
            const neighbors = adjacency.get(edge.source) ?? [];
            neighbors.push(edge.target);
            adjacency.set(edge.source, neighbors);
        }
        const queue = [nodeId];
        while (queue.length > 0) {
            const current = queue.shift();
            for (const neighbor of adjacency.get(current) ?? []) {
                if (!downstream.has(neighbor)) {
                    downstream.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }
        return graph.nodes.filter((n) => downstream.has(n.id));
    }
    getUpstreamCauses(graph, nodeId) {
        const upstream = new Set();
        const reverseAdjacency = new Map();
        for (const edge of graph.edges) {
            const neighbors = reverseAdjacency.get(edge.target) ?? [];
            neighbors.push(edge.source);
            reverseAdjacency.set(edge.target, neighbors);
        }
        const queue = [nodeId];
        while (queue.length > 0) {
            const current = queue.shift();
            for (const neighbor of reverseAdjacency.get(current) ?? []) {
                if (!upstream.has(neighbor)) {
                    upstream.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }
        return graph.nodes.filter((n) => upstream.has(n.id));
    }
    getMediators(graph) {
        return graph.nodes.filter((n) => n.type === "mediator");
    }
    exportGraph(graph) {
        return {
            nodes: [...graph.nodes],
            edges: [...graph.edges],
        };
    }
}
export function createCausalAnalyzer(config) {
    return new CausalAnalyzer(config);
}
//# sourceMappingURL=causal.js.map