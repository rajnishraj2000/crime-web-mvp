import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { initDriver, initializeDatabase, closeDriver } from './config/neo4j';
import caseRoutes from './routes/cases';
import reportRoutes from './routes/reports';
import graphRoutes from './routes/graph';
import analysisRoutes from './routes/analysis';
import blockchainRoutes from './routes/blockchain';
import { seedDemoData } from './services/seedService';
import { authMiddleware } from './middleware/auth';

// Load environment variables from .env
dotenv.config();

// Initialize Firebase Admin SDK
const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

if (process.env.FIREBASE_PROJECT_ID) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: firebasePrivateKey,
    }),
  });
  console.log('Firebase Admin SDK initialized');
} else {
  console.warn('⚠ FIREBASE_PROJECT_ID not set — auth middleware will reject all requests');
  initializeApp(); // Initialize with default (will fail token verification, but won't crash)
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = ['http://localhost:5173', process.env.FRONTEND_URL].filter(Boolean);
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like server-to-server) or matching allowed origins
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json({ limit: '10mb' })); // Support large JSON payloads (e.g., long FIR text)

// Health Check Endpoint (public — no auth required)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply auth middleware to all subsequent /api routes
app.use('/api', authMiddleware);

// Seed Endpoint (For demo purposes only)
app.post('/api/seed', async (req, res) => {
    try {
        const result = await seedDemoData();
        res.json(result);
    } catch (error) {
        console.error("Seeding failed:", error);
        res.status(500).json({ error: "Failed to seed database" });
    }
});

// Mount Routes
app.use('/api/cases', caseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/blockchain', blockchainRoutes);

// Server Startup
const startServer = async () => {
    try {
        // Initialize Neo4j Driver and Database constraints
        initDriver();
        await initializeDatabase();
        
        app.listen(PORT, () => {
            console.log(`CrimeWebAI Backend Server running on port ${PORT}`);
        });
        
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful Shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await closeDriver();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await closeDriver();
    process.exit(0);
});

startServer();
