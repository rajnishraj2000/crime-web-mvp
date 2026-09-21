import { v4 as uuidv4 } from 'uuid';
import { getSession } from '../config/neo4j';
import { storeEntities, storeRelationships } from './graphService';

/**
 * Seeds the database with demo data for presentation purposes.
 */
export const seedDemoData = async () => {
    const session = getSession();
    
    try {
        // --- CASE 1: Operation Shadow Network ---
        const case1Id = uuidv4();
        const case1Query = `
            CREATE (c:Case {
                id: $id, 
                title: 'Operation Shadow Network - Delhi Financial Fraud Ring', 
                description: 'Investigation into a large-scale financial fraud and money laundering syndicate operating out of Delhi NCR.',
                status: 'active',
                createdAt: $createdAt
            })
            RETURN c
        `;
        await session.run(case1Query, { id: case1Id, createdAt: new Date().toISOString() });
        
        // Entities for Case 1
        const rkId = uuidv4();
        const vsId = uuidv4();
        const ppId = uuidv4();
        const avId = uuidv4();
        const umId = uuidv4();
        const p1Id = uuidv4();
        const p2Id = uuidv4();
        const p3Id = uuidv4();
        
        const c1Entities = [
            { id: rkId, name: 'Rajan Kumar', type: 'Person', role: 'Kingpin', riskLevel: 'HIGH' },
            { id: vsId, name: 'Vikram Singh', type: 'Person', role: 'Financial Handler', riskLevel: 'HIGH' },
            { id: ppId, name: 'Priya Patel', type: 'Person', role: 'Forger', riskLevel: 'MEDIUM' },
            { id: avId, name: 'Amit Verma', type: 'Person', role: 'Money Laundering', riskLevel: 'HIGH' },
            { id: umId, name: 'Unknown Male', type: 'Person', riskLevel: 'MEDIUM' },
            { id: p1Id, name: '+91-9876543210', type: 'Phone' },
            { id: p2Id, name: '+91-9123456780', type: 'Phone' },
            { id: p3Id, name: '+91-7890123456', type: 'Phone' },
            { id: uuidv4(), name: 'SBI 3456789012', type: 'Account' },
            { id: uuidv4(), name: 'Greenfield Enterprises', type: 'Organization' },
            { id: uuidv4(), name: 'Lajpat Nagar', type: 'Location' },
            { id: uuidv4(), name: 'Meeting 8th March 2026', type: 'Event' },
            { id: uuidv4(), name: 'Case 178/2024', type: 'Event' }
        ];
        
        await storeEntities(case1Id, c1Entities);
        
        // Relationships for Case 1
        const c1Rels = [
            { sourceId: rkId, targetId: vsId, type: 'COMMUNICATES_WITH', evidence: 'Phone records show frequent contact' },
            { sourceId: rkId, targetId: p1Id, type: 'USES_PHONE', evidence: 'Primary device' },
            { sourceId: vsId, targetId: p2Id, type: 'USES_PHONE', evidence: 'Primary device' },
            { sourceId: umId, targetId: p3Id, type: 'USES_PHONE', evidence: 'Burner phone used in dropoff' },
            { sourceId: p1Id, targetId: p2Id, type: 'COMMUNICATES_WITH', evidence: 'Call logs' },
            { sourceId: rkId, targetId: ppId, type: 'ASSOCIATED_WITH', evidence: 'Spotted together at Lajpat Nagar' }
        ];
        
        await storeRelationships(case1Id, c1Rels);
        
        
        // --- CASE 2: Bengaluru Murder Case ---
        const case2Id = uuidv4();
        const case2Query = `
            CREATE (c:Case {
                id: $id, 
                title: 'Bengaluru Syndicate Murder', 
                description: 'Investigation into the murder of Suresh Reddy and links to organized crime.',
                status: 'active',
                createdAt: $createdAt
            })
            RETURN c
        `;
        await session.run(case2Query, { id: case2Id, createdAt: new Date().toISOString() });
        
        const srId = uuidv4();
        const hgId = uuidv4();
        const dsId = uuidv4();
        const faId = uuidv4();
        const mkId = uuidv4();
        const npId = uuidv4();
        
        const c2Entities = [
            { id: srId, name: 'Suresh Reddy', type: 'Person', role: 'Victim', riskLevel: 'LOW' },
            { id: hgId, name: 'Harish Gowda', type: 'Person', role: 'Kingpin', riskLevel: 'HIGH' },
            { id: dsId, name: 'Deepak Shetty', type: 'Person', riskLevel: 'MEDIUM' },
            { id: faId, name: 'Faisal Ahmed', type: 'Person', riskLevel: 'MEDIUM' },
            { id: mkId, name: 'Manoj Kumar', type: 'Person', riskLevel: 'MEDIUM' },
            { id: npId, name: 'Naveen Prakash', type: 'Person', riskLevel: 'MEDIUM' }
        ];
        
        await storeEntities(case2Id, c2Entities);
        
        const c2Rels = [
            { sourceId: hgId, targetId: srId, type: 'ASSOCIATED_WITH', evidence: 'Previous business dispute' },
            { sourceId: hgId, targetId: dsId, type: 'COMMUNICATES_WITH', evidence: 'Known associate' },
            { sourceId: faId, targetId: dsId, type: 'COMMUNICATES_WITH', evidence: 'Seen together' }
        ];
        
        await storeRelationships(case2Id, c2Rels);
        
        return { message: "Database seeded successfully", case1Id, case2Id };
        
    } finally {
        await session.close();
    }
};
