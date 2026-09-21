import { Router } from 'express';
import { getChain, verifyChain, getChainStats, addAuditBlock } from '../services/blockchainService';

const router = Router();

/**
 * GET /api/blockchain/:caseId/chain
 * Retrieves the full audit blockchain for a case.
 */
router.get('/:caseId/chain', async (req, res) => {
    const { caseId } = req.params;

    try {
        const chain = await getChain(caseId);
        res.json({ caseId, blocks: chain, totalBlocks: chain.length });
    } catch (error) {
        console.error('Error fetching audit chain:', error);
        res.status(500).json({ error: 'Failed to fetch audit chain' });
    }
});

/**
 * GET /api/blockchain/:caseId/verify
 * Verifies the integrity of the entire audit chain.
 * Returns whether the chain is valid or has been tampered with.
 */
router.get('/:caseId/verify', async (req, res) => {
    const { caseId } = req.params;

    try {
        const verification = await verifyChain(caseId);

        // Log the verification event itself as an audit block
        try {
            await addAuditBlock(caseId, {
                action: 'CHAIN_VERIFIED',
                details: {
                    result: verification.valid ? 'VALID' : 'TAMPERED',
                    totalBlocks: verification.totalBlocks,
                    ...(verification.brokenAt !== undefined && { brokenAt: verification.brokenAt })
                },
                userId: (req as any).user?.uid || 'system'
            });
        } catch (auditErr) {
            // Don't fail the verification if the audit logging fails
            console.warn('Failed to log verification audit event:', auditErr);
        }

        res.json(verification);
    } catch (error) {
        console.error('Error verifying audit chain:', error);
        res.status(500).json({ error: 'Failed to verify audit chain' });
    }
});

/**
 * GET /api/blockchain/:caseId/stats
 * Returns summary statistics for the audit chain.
 */
router.get('/:caseId/stats', async (req, res) => {
    const { caseId } = req.params;

    try {
        const stats = await getChainStats(caseId);
        res.json(stats);
    } catch (error) {
        console.error('Error fetching chain stats:', error);
        res.status(500).json({ error: 'Failed to fetch chain stats' });
    }
});

export default router;
