import neo4j, { Driver, Session } from 'neo4j-driver';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Extract connection details from environment variables
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';

let driver: Driver;

/**
 * Initializes the Neo4j driver singleton.
 * Uses connection pooling automatically managed by the neo4j-driver.
 */
export const initDriver = () => {
    if (!driver) {
        driver = neo4j.driver(
            NEO4J_URI,
            neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
            { disableLosslessIntegers: true } // Simplify working with JS numbers
        );
        console.log('Neo4j Driver initialized');
    }
    return driver;
};

/**
 * Returns a new session for executing queries.
 * Remember to close the session after use using session.close()
 */
export const getSession = (): Session => {
    if (!driver) {
        initDriver();
    }
    return driver.session();
};

/**
 * Initializes the database constraints and indexes.
 * This ensures data integrity and optimal query performance.
 */
export const initializeDatabase = async () => {
    const session = getSession();
    try {
        // Unique constraint for entities
        await session.run('CREATE CONSTRAINT unique_entity_id IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE');
        
        // Index for faster entity lookups by type
        await session.run('CREATE INDEX entity_type_idx IF NOT EXISTS FOR (e:Entity) ON (e.type)');
        
        // Index for filtering entities by case
        await session.run('CREATE INDEX entity_case_idx IF NOT EXISTS FOR (e:Entity) ON (e.caseId)');
        
        console.log('Database constraints and indexes initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        await session.close();
    }
};

/**
 * Closes the Neo4j driver connection for graceful shutdown.
 */
export const closeDriver = async () => {
    if (driver) {
        await driver.close();
        console.log('Neo4j Driver closed');
    }
};
