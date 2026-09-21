import { Router } from 'express';
import { extractNetworkData, generateIntelligenceSummary } from '../services/extractionService';
import { storeEntities, storeRelationships, getNetwork } from '../services/graphService';
import { addAuditBlock, sha256 } from '../services/blockchainService';
import { getSession } from '../config/neo4j';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * POST /api/analysis/extract
 * Extracts entities and relationships from text using OpenAI and stores them in Neo4j.
 */
router.post('/extract', async (req, res) => {
    const { text, caseId } = req.body;
    
    if (!text || !caseId) {
        return res.status(400).json({ error: "text and caseId are required" });
    }
    
    try {
        // 1. Extract data using OpenAI
        const extractedData = await extractNetworkData(text);
        
        // 2. Map and ensure unique IDs for entities within this extraction context
        // Query existing entities to resolve and deduplicate entities automatically
        const session = getSession();
        const existingEntitiesMap = new Map();
        try {
            const query = `MATCH (e:Entity {caseId: $caseId}) RETURN e.id as id, toLower(e.name) as name, e.type as type`;
            const result = await session.run(query, { caseId });
            result.records.forEach(r => {
                const key = `${r.get('name')}|${r.get('type')}`;
                existingEntitiesMap.set(key, r.get('id'));
            });
        } finally {
            await session.close();
        }

        const idMap = new Map(); // Maps LLM's temp ID to persistent UUID
        
        // We use a Map to keep track of unique entities in THIS payload as well
        const uniqueEntitiesToStore = new Map();

        extractedData.entities.forEach(e => {
            const searchKey = `${e.name.toLowerCase()}|${e.type}`;
            let finalId = existingEntitiesMap.get(searchKey);
            
            if (!finalId) {
                finalId = uuidv4();
                existingEntitiesMap.set(searchKey, finalId);
            }
            
            idMap.set(e.id, finalId);
            
            // Convert properties array to object for Neo4j
            const propsObj: Record<string, string> = {};
            if (e.properties && Array.isArray(e.properties)) {
                e.properties.forEach(p => {
                    propsObj[p.key] = p.value;
                });
            }
            
            // Overwrite in map to avoid pushing duplicate records to Neo4j if LLM hallucinates duplicates
            uniqueEntitiesToStore.set(finalId, {
                ...e,
                id: finalId,
                properties: propsObj
            });
        });
        
        const entitiesToStore = Array.from(uniqueEntitiesToStore.values());
        
        const relsToStore = extractedData.relationships
            .filter(r => idMap.has(r.sourceId) && idMap.has(r.targetId)) // Ensure both ends exist
            .map(r => ({
                ...r,
                sourceId: idMap.get(r.sourceId),
                targetId: idMap.get(r.targetId)
            }));
            
        // 3. Store in Neo4j
        const entityCount = await storeEntities(caseId, entitiesToStore);
        const relCount = await storeRelationships(caseId, relsToStore);
        
        res.json({
            message: "Extraction successful",
            entitiesAdded: entityCount,
            relationshipsAdded: relCount,
            data: {
                entities: entitiesToStore,
                relationships: relsToStore
            }
        });

        // Log to blockchain audit trail (fire-and-forget, don't block response)
        addAuditBlock(caseId, {
            action: 'ENTITY_EXTRACTION',
            details: {
                entitiesAdded: entityCount,
                relationshipsAdded: relCount,
                reportTextHash: sha256(text),
                entityTypes: entitiesToStore.map((e: any) => e.type)
            },
            userId: (req as any).user?.uid || 'system'
        }).catch(err => console.warn('Failed to log audit block for extraction:', err));
    } catch (error) {
        console.error("Error in extraction pipeline:", error);
        res.status(500).json({ error: "Failed to process extraction" });
    }
});

/**
 * GET /api/analysis/:caseId/centrality
 * Calculates degree centrality to identify key players in the network.
 */
router.get('/:caseId/centrality', async (req, res) => {
    const { caseId } = req.params;
    const session = getSession();
    
    try {
        const query = `
            MATCH (e:Entity {caseId: $caseId})-[r:LINKED_TO]-(other:Entity {caseId: $caseId})
            RETURN e.id as id, e.name as name, e.type as type, count(r) as degree
            ORDER BY degree DESC
            LIMIT 20
        `;
        
        const result = await session.run(query, { caseId });
        
        const centralities = result.records.map(record => ({
            id: record.get('id'),
            name: record.get('name'),
            type: record.get('type'),
            degree: Number(record.get('degree'))
        }));
        
        res.json(centralities);
    } catch (error) {
        console.error("Error calculating centrality:", error);
        res.status(500).json({ error: "Failed to calculate centrality" });
    } finally {
        await session.close();
    }
});

/**
 * GET /api/analysis/:caseId/patterns
 * Detects suspicious structural patterns in the graph (e.g., potential money laundering cycles).
 */
router.get('/:caseId/patterns', async (req, res) => {
    const { caseId } = req.params;
    const session = getSession();
    
    try {
        // 1. Detect Cycles (Potential Fraud/Money Laundering Rings)
        // A path of exactly 3 to 4 hops that loops back to the start
        const cycleQuery = `
            MATCH p=(a:Entity {caseId: $caseId})-[*3..4]->(a)
            WITH nodes(p) AS cycleNodes
            UNWIND cycleNodes AS n
            WITH DISTINCT n
            RETURN collect({id: n.id, name: n.name, type: n.type}) AS cycleEntities
            LIMIT 3
        `;
        const cycleResult = await session.run(cycleQuery, { caseId });
        
        // 2. Detect Brokers (Proxy for Betweenness)
        // Entities connecting different clusters
        const brokerQuery = `
            MATCH p=allShortestPaths((s:Entity {caseId: $caseId})-[*..4]-(t:Entity {caseId: $caseId}))
            WHERE id(s) < id(t)
            UNWIND nodes(p)[1..-1] AS n
            RETURN n.id AS id, n.name AS name, n.type AS type, count(*) AS brokerScore
            ORDER BY brokerScore DESC
            LIMIT 5
        `;
        const brokerResult = await session.run(brokerQuery, { caseId });

        const patterns = {
            cycles: cycleResult.records.map(r => r.get('cycleEntities')).filter(arr => arr.length > 0),
            brokers: brokerResult.records.map(r => ({
                id: r.get('id'),
                name: r.get('name'),
                type: r.get('type'),
                score: Number(r.get('brokerScore'))
            })).filter(b => b.score > 0)
        };
        
        res.json(patterns);
    } catch (error) {
        console.error("Error detecting patterns:", error);
        res.status(500).json({ error: "Failed to detect patterns" });
    } finally {
        await session.close();
    }
});

/**
 * GET /api/analysis/:caseId/summary
 * Generates an AI-driven intelligence summary of the entire case network.
 */
router.get('/:caseId/summary', async (req, res) => {
    const { caseId } = req.params;
    
    try {
        const networkData = await getNetwork(caseId);
        
        if (networkData.nodes.length === 0) {
            return res.json({ summary: "No data available for this case yet." });
        }
        
        const summary = await generateIntelligenceSummary(networkData);
        
        res.json({ summary });
    } catch (error) {
        console.error("Error generating summary:", error);
        res.status(500).json({ error: "Failed to generate summary" });
    }
});

export default router;
