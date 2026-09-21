import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getSession } from '../config/neo4j';
import { addAuditBlock, sha256 } from '../services/blockchainService';

const router = Router();

/**
 * POST /api/reports
 * Ingests a new report and links it to a case.
 */
router.post('/', async (req, res) => {
    const { caseId, text, reportType } = req.body;
    
    if (!caseId || !text) {
        return res.status(400).json({ error: "caseId and text are required" });
    }
    
    const session = getSession();
    try {
        // Verify case exists
        const caseCheck = await session.run('MATCH (c:Case {id: $caseId}) RETURN c', { caseId });
        if (caseCheck.records.length === 0) {
            return res.status(404).json({ error: "Case not found" });
        }
        
        const reportId = uuidv4();
        const createdAt = new Date().toISOString();
        
        const query = `
            MATCH (c:Case {id: $caseId})
            CREATE (r:Report {
                id: $reportId,
                text: $text,
                reportType: $reportType,
                caseId: $caseId,
                createdAt: $createdAt
            })
            CREATE (c)-[:HAS_REPORT]->(r)
            RETURN r
        `;
        
        const result = await session.run(query, { reportId, caseId, text, reportType: reportType || 'GENERAL', createdAt });
        const createdReport = result.records[0].get('r').properties;
        
        res.status(201).json(createdReport);

        // Log to blockchain audit trail (fire-and-forget)
        addAuditBlock(caseId, {
            action: 'REPORT_INGESTED',
            details: {
                reportId,
                reportType: reportType || 'GENERAL',
                textHash: sha256(text),
                textLength: text.length
            },
            userId: (req as any).user?.uid || 'system'
        }).catch(err => console.warn('Failed to log audit block for report:', err));
    } catch (error) {
        console.error("Error ingesting report:", error);
        res.status(500).json({ error: "Failed to ingest report" });
    } finally {
        await session.close();
    }
});

/**
 * GET /api/reports/:caseId
 * Retrieves all reports linked to a specific case.
 */
router.get('/:caseId', async (req, res) => {
    const { caseId } = req.params;
    const session = getSession();
    
    try {
        const query = `
            MATCH (r:Report {caseId: $caseId})
            RETURN r
            ORDER BY r.createdAt DESC
        `;
        
        const result = await session.run(query, { caseId });
        const reports = result.records.map(record => record.get('r').properties);
        
        res.json(reports);
    } catch (error) {
        console.error("Error fetching reports:", error);
        res.status(500).json({ error: "Failed to fetch reports" });
    } finally {
        await session.close();
    }
});

export default router;
