/**
 * Graph Builder - Builds causal relationship graphs and performs impact analysis
 */
function generateId() {
    return Math.random().toString(36).slice(2, 10);
}
export class GraphBuilder {
    build(variables, relations) {
        const now = new Date();
        const graph = {
            id: generateId(),
            variables,
            relations,
            metadata: {
                sourceText: '',
                createdAt: now,
                variableCount: variables.length,
                relationCount: relations.length,
            },
        };
        return graph;
    }
    detectCycles(relations) {
        const adjList = new Map();
        for (const rel of relations) {
            if (!adjList.has(rel.sourceId))
                adjList.set(rel.sourceId, []);
            adjList.get(rel.sourceId).push(rel.targetId);
        }
        const cycles = [];
        const visited = new Set();
        const inStack = new Set();
        const path = [];
        const dfs = (node) => {
            if (inStack.has(node)) {
                const cycleStart = path.indexOf(node);
                if (cycleStart !== -1) {
                    cycles.push([...path.slice(cycleStart), node]);
                }
                return;
            }
            if (visited.has(node))
                return;
            visited.add(node);
            inStack.add(node);
            path.push(node);
            const neighbors = adjList.get(node) ?? [];
            for (const neighbor of neighbors) {
                dfs(neighbor);
            }
            path.pop();
            inStack.delete(node);
        };
        for (const node of adjList.keys()) {
            dfs(node);
        }
        return cycles;
    }
    analyzeImpact(relationId, variables, relations) {
        const targetRel = relations.find((r) => r.id === relationId);
        if (!targetRel) {
            return {
                chainId: generateId(),
                rootCause: '',
                impactPaths: [],
                summary: 'Relation not found',
            };
        }
        const rootVar = variables.find((v) => v.id === targetRel.sourceId);
        const rootCause = rootVar?.name ?? 'Unknown';
        // BFS from root cause to find all impact paths
        const adjList = new Map();
        for (const rel of relations) {
            if (!adjList.has(rel.sourceId))
                adjList.set(rel.sourceId, []);
            adjList.get(rel.sourceId).push(rel);
        }
        const impactPaths = [];
        const queue = [
            { nodeId: targetRel.sourceId, path: [], visited: new Set([targetRel.sourceId]) },
        ];
        while (queue.length > 0) {
            const current = queue.shift();
            const outgoing = adjList.get(current.nodeId) ?? [];
            for (const rel of outgoing) {
                if (current.visited.has(rel.targetId))
                    continue;
                const newPath = [...current.path, rel];
                const targetVar = variables.find((v) => v.id === rel.targetId);
                const pathStrength = newPath.reduce((p, r) => p * r.strength, 1);
                impactPaths.push({
                    from: variables.find((v) => v.id === rel.sourceId)?.name ?? 'Unknown',
                    to: targetVar?.name ?? 'Unknown',
                    description: rel.relation,
                    strength: pathStrength,
                });
                // Continue BFS up to depth 5
                if (newPath.length < 5) {
                    const newVisited = new Set(current.visited);
                    newVisited.add(rel.targetId);
                    queue.push({
                        nodeId: rel.targetId,
                        path: newPath,
                        visited: newVisited,
                    });
                }
            }
        }
        const summary = impactPaths.length > 0
            ? `Impact analysis from "${rootCause}": ${impactPaths.length} impact path(s) found`
            : `No further impacts found from "${rootCause}"`;
        return {
            chainId: generateId(),
            rootCause,
            impactPaths,
            summary,
        };
    }
    findConnectedComponents(variables, relations) {
        if (variables.length === 0)
            return [];
        const adjList = new Map();
        for (const v of variables)
            adjList.set(v.id, []);
        for (const rel of relations) {
            adjList.get(rel.sourceId)?.push(rel.targetId);
            adjList.get(rel.targetId)?.push(rel.sourceId);
        }
        const visited = new Set();
        const components = [];
        for (const v of variables) {
            if (visited.has(v.id))
                continue;
            // BFS to find connected component
            const componentIds = new Set();
            const queue = [v.id];
            visited.add(v.id);
            while (queue.length > 0) {
                const current = queue.shift();
                componentIds.add(current);
                const neighbors = adjList.get(current) ?? [];
                for (const n of neighbors) {
                    if (!visited.has(n)) {
                        visited.add(n);
                        queue.push(n);
                    }
                }
            }
            const compVars = variables.filter((x) => componentIds.has(x.id));
            const compRels = relations.filter((r) => componentIds.has(r.sourceId) || componentIds.has(r.targetId));
            components.push(this.build(compVars, compRels));
        }
        return components;
    }
}
//# sourceMappingURL=graph_builder.js.map