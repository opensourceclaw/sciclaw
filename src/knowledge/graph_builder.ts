import crypto from "crypto";
import type { Entity } from "../core/index.js";
import type { Relation } from "../core/index.js";
import type { GraphNode, GraphEdge, KnowledgeGraph } from "./types.js";

function hash(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 8);
}

function entityToNode(entity: Entity): GraphNode {
  return {
    id: hash(entity.text),
    label: entity.text,
    type: entity.type,
    properties: { start: entity.start, end: entity.end },
    confidence: entity.confidence,
    sources: [],
  };
}

function relationToEdge(relation: Relation, sourceNodeId: string, targetNodeId: string): GraphEdge {
  return {
    id: hash(`${sourceNodeId}:${relation.type}:${targetNodeId}`),
    sourceId: sourceNodeId,
    targetId: targetNodeId,
    type: relation.type,
    label: relation.type,
    confidence: relation.confidence,
    properties: {},
    sources: [],
  };
}

export function buildGraph(entities: Entity[], relations: Relation[]): KnowledgeGraph {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();
  const adjacencyList = new Map<string, Set<string>>();

  for (const entity of entities) {
    const node = entityToNode(entity);
    const existing = nodes.get(node.id);
    if (existing) {
      if (node.confidence > existing.confidence) {
        existing.confidence = node.confidence;
      }
    } else {
      nodes.set(node.id, node);
      adjacencyList.set(node.id, new Set());
    }
  }

  for (const relation of relations) {
    const sourceId = hash(relation.source);
    const targetId = hash(relation.target);

    if (!nodes.has(sourceId) || !nodes.has(targetId)) {
      console.warn(`Relation references unknown entity: "${relation.source}" or "${relation.target}"`);
      continue;
    }

    const edge = relationToEdge(relation, sourceId, targetId);
    edges.set(edge.id, edge);
    adjacencyList.get(sourceId)!.add(targetId);
    adjacencyList.get(targetId)!.add(sourceId);
  }

  return { nodes, edges, adjacencyList };
}

export function mergeGraphs(graphs: KnowledgeGraph[]): KnowledgeGraph {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();
  const adjacencyList = new Map<string, Set<string>>();

  for (const graph of graphs) {
    for (const [id, node] of graph.nodes) {
      const existing = nodes.get(id);
      if (!existing || node.confidence > existing.confidence) {
        nodes.set(id, node);
      }
    }
    for (const [id, edge] of graph.edges) {
      edges.set(id, edge);
    }
    for (const [id, neighbors] of graph.adjacencyList) {
      if (!adjacencyList.has(id)) adjacencyList.set(id, new Set());
      for (const n of neighbors) adjacencyList.get(id)!.add(n);
    }
  }

  return { nodes, edges, adjacencyList };
}

export function addToGraph(graph: KnowledgeGraph, entities: Entity[], relations: Relation[]): KnowledgeGraph {
  const merged = buildGraph(entities, relations);
  return mergeGraphs([graph, merged]);
}
