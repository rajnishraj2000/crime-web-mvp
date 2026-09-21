import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getSession } from '../config/neo4j';
import { addAuditBlock } from '../services/blockchainService';

const router = Router();

/**
 * POST /api/cases
 * Creates a new case in the database.
 */
router.post('/', async (req, res) => {
    const { title, description } = req.body;
    
    if (!title) {
        return res.status(400).json({ error: "Title is required" });
    }
    
    const session = getSession();
    try {
        const caseId = uuidv4();
        const createdAt = new Date().toISOString();
        
        const query = `
            CREATE (c:Case {
                id: $caseId, 
                title: $title, 
                description: $description,
                status: 'active',
                createdAt: $createdAt
            })
            RETURN c
        `;
        
        const result = await session.run(query, { caseId, title, description, createdAt });
        const createdCase = result.records[0].get('c').properties;
        
        res.status(201).json(createdCase);

        // Log to blockchain audit trail (fire-and-forget)
        addAuditBlock(caseId, {
            action: 'CASE_CREATED',
            details: {
                caseId,
                title,
                description: description || ''
            },
            userId: (req as any).user?.uid || 'system'
        }).catch(err => console.warn('Failed to log audit block for case creation:', err));
    } catch (error) {
        console.error("Error creating case:", error);
        res.status(500).json({ error: "Failed to create case" });
    } finally {
        await session.close();
    }
});

/**
 * GET /api/cases
 * Lists all cases, ordered by creation date descending.
 */
router.get('/', async (req, res) => {
    const session = getSession();
    try {
        const query = `
            MATCH (c:Case)
            RETURN c
            ORDER BY c.createdAt DESC
        `;
        
        const result = await session.run(query);
        const cases = result.records.map(r => r.get('c').properties);
        
        res.json(cases);
    } catch (error) {
        console.error("Error fetching cases:", error);
        res.status(500).json({ error: "Failed to fetch cases" });
    } finally {
        await session.close();
    }
});

/**
 * GET /api/cases/:id
 * Fetches a single case by ID, including counts of associated entities and reports.
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const session = getSession();
    
    try {
        const query = `
            MATCH (c:Case {id: $id})
            OPTIONAL MATCH (e:Entity {caseId: $id})
            OPTIONAL MATCH (r:Report {caseId: $id})
            RETURN c, count(DISTINCT e) as entityCount, count(DISTINCT r) as reportCount
        `;
        
        const result = await session.run(query, { id });
        
        if (result.records.length === 0) {
            return res.status(404).json({ error: "Case not found" });
        }
        
        const record = result.records[0];
        const caseData = record.get('c').properties;
        const entityCount = Number(record.get('entityCount'));
        const reportCount = Number(record.get('reportCount'));
        
        res.json({ ...caseData, entityCount, reportCount });
    } catch (error) {
        console.error("Error fetching case:", error);
        res.status(500).json({ error: "Failed to fetch case details" });
    } finally {
        await session.close();
    }
});

export default router;
