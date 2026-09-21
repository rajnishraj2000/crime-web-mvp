import { createHash } from 'crypto';
import { getSession } from '../config/neo4j';

/**
 * Blockchain Audit Trail Service
 * 
 * Implements a SHA-256 hash chain stored in Neo4j as :AuditBlock nodes
 * with :PREV_BLOCK relationships, providing an immutable, verifiable
 * evidence audit trail for criminal investigations.
 * 
 * This fulfills the SIH "Blockchain & Cybersecurity" theme requirement
 * by demonstrating tamper-proof chain-of-custody for digital evidence.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuditEvent {
    action: string;           // e.g. 'ENTITY_EXTRACTION', 'REPORT_INGESTED', 'CASE_CREATED'
    details: Record<string, any>;
    userId?: string;
}

export interface AuditBlock {
    index: number;
    timestamp: string;
    data: string;             // JSON stringified audit event
    dataHash: string;         // SHA-256 of the data payload alone
    previousHash: string;
    hash: string;
    nonce: number;
    caseId: string;
}

export interface ChainVerification {
    valid: boolean;
    totalBlocks: number;
    brokenAt?: number;        // Index of first invalid block
    brokenReason?: string;
    verifiedAt: string;
}

// ─── Hashing Helpers ─────────────────────────────────────────────────────────

const DIFFICULTY = 2; // Number of leading zeros required (low for demo speed)

/**
 * Compute SHA-256 hash of any input string.
 */
export function sha256(input: string): string {
    return createHash('sha256').update(input).digest('hex');
}

/**
 * Compute the hash of a block using its fields.
 */
function calculateBlockHash(
    index: number,
    timestamp: string,
    data: string,
    previousHash: string,
    nonce: number
): string {
    return sha256(`${index}${timestamp}${data}${previousHash}${nonce}`);
}

/**
 * Mine a block by incrementing the nonce until the hash starts with
 * the required number of leading zeros (proof-of-work).
 */
function mineBlock(
    index: number,
    timestamp: string,
    data: string,
    previousHash: string
): { hash: string; nonce: number } {
    const prefix = '0'.repeat(DIFFICULTY);
    let nonce = 0;
    let hash = '';

    do {
        hash = calculateBlockHash(index, timestamp, data, previousHash, nonce);
        nonce++;
    } while (!hash.startsWith(prefix));

    return { hash, nonce: nonce - 1 };
}

// ─── Blockchain Operations ───────────────────────────────────────────────────

/**
 * Creates the genesis block (index 0) for a new case.
 * Called automatically when the first audit event is logged for a case.
 */
async function createGenesisBlock(caseId: string): Promise<AuditBlock> {
    const timestamp = new Date().toISOString();
    const data = JSON.stringify({
        action: 'GENESIS',
        details: { message: 'Blockchain audit trail initialized', caseId }
    });
    const dataHash = sha256(data);
    const previousHash = '0'.repeat(64); // Genesis block has no predecessor

    const { hash, nonce } = mineBlock(0, timestamp, data, previousHash);

    const block: AuditBlock = {
        index: 0,
        timestamp,
        data,
        dataHash,
        previousHash,
        hash,
        nonce,
        caseId
    };

    // Store in Neo4j
    const session = getSession();
    try {
        await session.run(`
            CREATE (b:AuditBlock {
                blockIndex: $index,
                timestamp: $timestamp,
                data: $data,
                dataHash: $dataHash,
                previousHash: $previousHash,
                hash: $hash,
                nonce: $nonce,
                caseId: $caseId
            })
        `, {
            index: block.index,
            timestamp: block.timestamp,
            data: block.data,
            dataHash: block.dataHash,
            previousHash: block.previousHash,
            hash: block.hash,
            nonce: block.nonce,
            caseId: block.caseId
        });
    } finally {
        await session.close();
    }

    return block;
}

/**
 * Adds a new block to the audit chain for a case.
 * Automatically creates the genesis block if the chain doesn't exist yet.
 */
export async function addAuditBlock(caseId: string, event: AuditEvent): Promise<AuditBlock> {
    const session = getSession();

    try {
        // 1. Find the latest block in the chain
        const latestResult = await session.run(`
            MATCH (b:AuditBlock {caseId: $caseId})
            RETURN b
            ORDER BY b.blockIndex DESC
            LIMIT 1
        `, { caseId });

        let previousHash: string;
        let newIndex: number;

        if (latestResult.records.length === 0) {
            // No chain exists yet — create genesis block first
            const genesis = await createGenesisBlock(caseId);
            previousHash = genesis.hash;
            newIndex = 1;
        } else {
            const latestBlock = latestResult.records[0].get('b').properties;
            previousHash = latestBlock.hash;
            newIndex = (typeof latestBlock.blockIndex === 'object' && 'toNumber' in latestBlock.blockIndex)
                ? latestBlock.blockIndex.toNumber() + 1
                : Number(latestBlock.blockIndex) + 1;
        }

        // 2. Prepare and mine the new block
        const timestamp = new Date().toISOString();
        const data = JSON.stringify({
            ...event,
            timestamp
        });
        const dataHash = sha256(data);
        const { hash, nonce } = mineBlock(newIndex, timestamp, data, previousHash);

        const block: AuditBlock = {
            index: newIndex,
            timestamp,
            data,
            dataHash,
            previousHash,
            hash,
            nonce,
            caseId
        };

        // 3. Store block and link to previous
        await session.run(`
            MATCH (prev:AuditBlock {caseId: $caseId, hash: $previousHash})
            CREATE (b:AuditBlock {
                blockIndex: $index,
                timestamp: $timestamp,
                data: $data,
                dataHash: $dataHash,
                previousHash: $previousHash,
                hash: $hash,
                nonce: $nonce,
                caseId: $caseId
            })
            CREATE (b)-[:PREV_BLOCK]->(prev)
        `, {
            index: block.index,
            timestamp: block.timestamp,
            data: block.data,
            dataHash: block.dataHash,
            previousHash: block.previousHash,
            hash: block.hash,
            nonce: block.nonce,
            caseId: block.caseId
        });

        console.log(`⛓️  Audit Block #${newIndex} mined for case ${caseId.substring(0, 8)}... [${event.action}]`);

        return block;
    } finally {
        await session.close();
    }
}

/**
 * Retrieves the full audit chain for a case, ordered by block index.
 */
export async function getChain(caseId: string): Promise<AuditBlock[]> {
    const session = getSession();
    try {
        const result = await session.run(`
            MATCH (b:AuditBlock {caseId: $caseId})
            RETURN b
            ORDER BY b.blockIndex ASC
        `, { caseId });

        return result.records.map(record => {
            const props = record.get('b').properties;
            return {
                index: typeof props.blockIndex === 'object' && 'toNumber' in props.blockIndex
                    ? props.blockIndex.toNumber() : Number(props.blockIndex),
                timestamp: props.timestamp,
                data: props.data,
                dataHash: props.dataHash,
                previousHash: props.previousHash,
                hash: props.hash,
                nonce: typeof props.nonce === 'object' && 'toNumber' in props.nonce
                    ? props.nonce.toNumber() : Number(props.nonce),
                caseId: props.caseId
            };
        });
    } finally {
        await session.close();
    }
}

/**
 * Verifies the integrity of the entire audit chain for a case.
 * Checks that:
 *   1. Each block's hash is valid (recalculated matches stored hash)
 *   2. Each block's previousHash matches the prior block's hash
 *   3. All hashes meet the difficulty requirement
 */
export async function verifyChain(caseId: string): Promise<ChainVerification> {
    const chain = await getChain(caseId);
    const verifiedAt = new Date().toISOString();

    if (chain.length === 0) {
        return { valid: true, totalBlocks: 0, verifiedAt };
    }

    const prefix = '0'.repeat(DIFFICULTY);

    for (let i = 0; i < chain.length; i++) {
        const block = chain[i];

        // 1. Verify the hash is correctly calculated
        const recalculatedHash = calculateBlockHash(
            block.index,
            block.timestamp,
            block.data,
            block.previousHash,
            block.nonce
        );

        if (recalculatedHash !== block.hash) {
            return {
                valid: false,
                totalBlocks: chain.length,
                brokenAt: block.index,
                brokenReason: `Block #${block.index}: Hash mismatch. Expected ${recalculatedHash.substring(0, 16)}..., got ${block.hash.substring(0, 16)}...`,
                verifiedAt
            };
        }

        // 2. Verify proof-of-work (hash meets difficulty)
        if (!block.hash.startsWith(prefix)) {
            return {
                valid: false,
                totalBlocks: chain.length,
                brokenAt: block.index,
                brokenReason: `Block #${block.index}: Hash does not meet difficulty requirement`,
                verifiedAt
            };
        }

        // 3. Verify chain linkage (skip genesis block)
        if (i > 0) {
            const prevBlock = chain[i - 1];
            if (block.previousHash !== prevBlock.hash) {
                return {
                    valid: false,
                    totalBlocks: chain.length,
                    brokenAt: block.index,
                    brokenReason: `Block #${block.index}: Previous hash mismatch. Chain broken between block #${i - 1} and #${i}`,
                    verifiedAt
                };
            }
        }
    }

    return { valid: true, totalBlocks: chain.length, verifiedAt };
}

/**
 * Gets summary stats for the audit chain of a case.
 */
export async function getChainStats(caseId: string) {
    const chain = await getChain(caseId);

    if (chain.length === 0) {
        return {
            totalBlocks: 0,
            chainAge: null,
            lastActivity: null,
            actions: {}
        };
    }

    // Count actions by type
    const actions: Record<string, number> = {};
    chain.forEach(block => {
        try {
            const parsed = JSON.parse(block.data);
            const action = parsed.action || 'UNKNOWN';
            actions[action] = (actions[action] || 0) + 1;
        } catch {
            // Ignore parse errors
        }
    });

    return {
        totalBlocks: chain.length,
        chainAge: chain[0].timestamp,
        lastActivity: chain[chain.length - 1].timestamp,
        actions
    };
}
