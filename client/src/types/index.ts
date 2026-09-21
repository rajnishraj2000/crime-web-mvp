export type EntityType = 'Person' | 'Phone' | 'Account' | 'Location' | 'Organization' | 'Vehicle' | 'Event';

export interface GraphNode {
  id: string;
  label: string; // Used for display
  name?: string;
  type: EntityType;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  properties?: Record<string, any>;
  degree?: number;
  community?: number;
  val?: number; // Used for node size in force graph
  x?: number; // Added by force graph
  y?: number; // Added by force graph
}

export interface GraphEdge {
  source: string | GraphNode;
  target: string | GraphNode;
  relType: string;
  evidence?: string;
  weight?: number;
}

export interface Case {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  entityCount?: number;
  relationshipCount?: number;
}

export interface StatsData {
  entityCounts: Record<string, number>;
  totalRelationships: number;
  riskDistribution: Record<string, number>;
}

// ─── Blockchain Audit Types ──────────────────────────────────────────────────

export interface AuditBlock {
  index: number;
  timestamp: string;
  data: string;           // JSON stringified audit event
  dataHash: string;
  previousHash: string;
  hash: string;
  nonce: number;
  caseId: string;
}

export interface ChainVerification {
  valid: boolean;
  totalBlocks: number;
  brokenAt?: number;
  brokenReason?: string;
  verifiedAt: string;
}

export interface ChainStats {
  totalBlocks: number;
  chainAge: string | null;
  lastActivity: string | null;
  actions: Record<string, number>;
}
