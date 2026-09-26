# CrimeWebAI — MVP

> AI-Powered Criminal Network Analysis System (SIH 2026)

## Quick Start

```bash
# 1. Install all dependencies
npm run install:all

# 2. Copy env file and fill in your keys
cd server
cp .env.example .env
# Edit .env with your Neo4j and OpenAI credentials

# 3. Start both servers (from root)
cd ..
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

## Environment Variables

Create `server/.env`:
```env
PORT=3001
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password
OPENAI_API_KEY=sk-xxxxx
```

> **Free Neo4j:** Get a free cloud instance at [Neo4j AuraDB](https://neo4j.com/cloud/aura-free/)
> **Local Neo4j:** Use `bolt://localhost:7687` with Docker: `docker run -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/test1234 neo4j:5-community`

## Tech Stack

| Layer | Technology |
|:---|:---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Visualization | react-force-graph-2d |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Node.js + Express + TypeScript |
| Graph Database | Neo4j (AuraDB Free / Local Docker) |
| AI/NLP | OpenAI GPT-4o (Structured Outputs) |

## Deployment

- **Frontend → Vercel:** Connect GitHub repo, set root to `crime-web-mvp/client`
- **Backend → Render:** Connect GitHub repo, set root to `crime-web-mvp/server`
- **Database → Neo4j AuraDB Free:** Zero-config cloud graph database

## Features

- 📊 Dashboard — Case stats, risk breakdown, entity counts
- 🕸️ Interactive Network Graph — Force-directed visualization
- 🔍 Entity Inspector — Click any node for details
- 📄 Report Upload — Paste FIR text → AI extracts entities
- 🎯 Centrality Analysis — Auto-identifies the kingpin
- 🏘️ Community Detection — Colors nodes by gang/cluster
- 🌙 Dark Theme — Professional intelligence dashboard
