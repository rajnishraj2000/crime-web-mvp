import { Router } from 'express';
import { getNetwork, getStats } from '../services/graphService';

const router = Router();

/**
 * GET /api/graph/:caseId/network
 * Retrieves the full graph structure (nodes and edges) for visualization.
 */
router.get('/:caseId/network', async (req, res) => {
    const { caseId } = req.params;
    
    try {
        const network = await getNetwork(caseId);
        res.json(network);
    } catch (error) {
        console.error("Error fetching network graph:", error);
        res.status(500).json({ error: "Failed to fetch network graph" });
    }
});

/**
 * GET /api/graph/:caseId/stats
 * Retrieves graph statistics like entity counts and risk distribution.
 */
router.get('/:caseId/stats', async (req, res) => {
    const { caseId } = req.params;
    
    try {
        const stats = await getStats(caseId);
        res.json(stats);
    } catch (error) {
        console.error("Error fetching graph stats:", error);
        res.status(500).json({ error: "Failed to fetch graph statistics" });
    }
});

export default router;
