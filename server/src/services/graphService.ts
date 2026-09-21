import { getSession } from '../config/neo4j';
import { v4 as uuidv4 } from 'uuid';

/**
 * Stores extracted entities in Neo4j.
 * Uses MERGE to ensure idempotency.
 */
export const storeEntities = async (caseId: string, entities: any[]) => {
    const session = getSession();
    try {
        const query = `
            UNWIND $entities AS entity
            MERGE (e:Entity {id: entity.id})
            SET e += entity.properties,
                e.name = entity.name,
                e.type = entity.type,
                e.role = entity.role,
                e.riskLevel = entity.riskLevel,
                e.caseId = $caseId
            RETURN count(e) as createdCount
        `;
        
        const result = await session.run(query, {
            caseId,
            entities: entities.map(e => ({
                id: e.id || uuidv4(),
                name: e.name,
                type: e.type,
                role: e.role || null,
                riskLevel: e.riskLevel || 'MEDIUM',
                properties: e.properties || {}
            }))
        });
        
        return Number(result.records[0].get('createdCount'));
    } finally {
        await session.close();
    }
};

/**
 * Stores relationships between entities in Neo4j.
 * Uses a generic LINKED_TO relationship with relType as a property for simplicity,
 * avoiding the need for APOC dynamic relationship types.
 */
export const storeRelationships = async (caseId: string, relationships: any[]) => {
    const session = getSession();
    try {
        const query = `
            UNWIND $relationships AS rel
            MATCH (source:Entity {id: rel.sourceId, caseId: $caseId})
            MATCH (target:Entity {id: rel.targetId, caseId: $caseId})
            MERGE (source)-[r:LINKED_TO {relType: rel.type, targetId: rel.targetId}]->(target)
            SET r.evidence = rel.evidence,
                r.weight = rel.weight,
                r.caseId = $caseId
            RETURN count(r) as createdCount
        `;
        
        const result = await session.run(query, {
            caseId,
            relationships: relationships.map(r => ({
                sourceId: r.sourceId,
                targetId: r.targetId,
                type: r.type,
                evidence: r.evidence || '',
                weight: r.weight || 1.0
            }))
        });
        
        return Number(result.records[0].get('createdCount'));
    } finally {
        await session.close();
    }
};

/**
 * Fetches the entire network graph for a given case.
 * Formats the output for use with visualization libraries like react-force-graph.
 */
export const getNetwork = async (caseId: string) => {
    const session = getSession();
    try {
        const query = `
            MATCH (e:Entity {caseId: $caseId})
            OPTIONAL MATCH (e)-[r:LINKED_TO]->(e2:Entity {caseId: $caseId})
            RETURN e, r, e2
        `;
        
        const result = await session.run(query, { caseId });
        
        const nodesMap = new Map();
        const edges: any[] = [];
        
        result.records.forEach(record => {
            const e1 = record.get('e');
            if (e1 && !nodesMap.has(e1.properties.id)) {
                nodesMap.set(e1.properties.id, {
                    id: e1.properties.id,
                    label: e1.properties.name,
                    type: e1.properties.type,
                    ...e1.properties
                });
            }
            
            const r = record.get('r');
            const e2 = record.get('e2');
            
            if (r && e2) {
                if (!nodesMap.has(e2.properties.id)) {
                    nodesMap.set(e2.properties.id, {
                        id: e2.properties.id,
                        label: e2.properties.name,
                        type: e2.properties.type,
                        ...e2.properties
                    });
                }
                
                edges.push({
                    source: e1.properties.id,
                    target: e2.properties.id,
                    relType: r.properties.relType, // Must match frontend GraphEdge.relType
                    evidence: r.properties.evidence,
                    weight: r.properties.weight,
                    id: r.identity.toString() // Use internal neo4j id for unique edge key
                });
            }
        });
        
        return {
            nodes: Array.from(nodesMap.values()),
            edges
        };
    } finally {
        await session.close();
    }
};

/**
 * Fetches statistics for the entities and relationships in a case.
 */
export const getStats = async (caseId: string) => {
    const session = getSession();
    try {
        // Total entities by type
        const typeQuery = `
            MATCH (e:Entity {caseId: $caseId})
            RETURN e.type as type, count(e) as count
        `;
        const typeResult = await session.run(typeQuery, { caseId });
        const entityTypes: Record<string, number> = {};
        typeResult.records.forEach(record => {
            entityTypes[record.get('type')] = Number(record.get('count'));
        });

        // Total entities
        const totalEntities = Object.values(entityTypes).reduce((a, b) => a + b, 0);

        // Total relationships
        const relQuery = `
            MATCH (e1:Entity {caseId: $caseId})-[r:LINKED_TO]->(e2:Entity {caseId: $caseId})
            RETURN count(r) as count
        `;
        const relResult = await session.run(relQuery, { caseId });
        const totalRelationships = Number(relResult.records[0].get('count'));
        
        // Risk distribution
        const riskQuery = `
            MATCH (e:Entity {caseId: $caseId})
            RETURN e.riskLevel as riskLevel, count(e) as count
        `;
        const riskResult = await session.run(riskQuery, { caseId });
        const riskDistribution: Record<string, number> = {};
        riskResult.records.forEach(record => {
            const risk = record.get('riskLevel') || 'UNKNOWN';
            riskDistribution[risk] = Number(record.get('count'));
        });

        return {
            totalEntities,
            totalRelationships,
            entityCounts: entityTypes, // Renamed to match frontend StatsData interface
            riskDistribution
        };
    } finally {
        await session.close();
    }
};
