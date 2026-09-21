import axios from 'axios';
import { Case, StatsData, AuditBlock, ChainVerification, ChainStats } from '../types';
import { auth } from '../config/firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Attach Firebase ID token to every outgoing request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Cases
export const getCases = () => api.get<Case[]>('/cases').then(res => res.data);
export const getCase = (id: string) => api.get<Case>(`/cases/${id}`).then(res => res.data);
export const createCase = (data: { title: string; description: string }) => api.post('/cases', data).then(res => res.data);

// Reports
export const getReports = (caseId: string) => api.get(`/reports/${caseId}`).then(res => res.data);
export const createReport = (data: { caseId: string; text: string; reportType: string }) => api.post('/reports', data).then(res => res.data);

// Graph & Stats
export const getNetwork = (caseId: string) => api.get(`/graph/${caseId}/network`).then(res => res.data);
export const getStats = (caseId: string) => api.get<StatsData>(`/graph/${caseId}/stats`).then(res => res.data);

// Analysis
export const extractEntities = (data: { text: string; caseId: string }) => api.post('/analysis/extract', data).then(res => res.data);
export const getCentrality = (caseId: string) => api.get(`/analysis/${caseId}/centrality`).then(res => res.data);
export const getPatterns = (caseId: string) => api.get(`/analysis/${caseId}/patterns`).then(res => res.data);
export const getSummary = (caseId: string) => api.get(`/analysis/${caseId}/summary`).then(res => res.data);

// Demo Data
export const seedData = () => api.post('/seed').then(res => res.data);

// Blockchain Audit Trail
export const getAuditChain = (caseId: string) =>
  api.get<{ caseId: string; blocks: AuditBlock[]; totalBlocks: number }>(`/blockchain/${caseId}/chain`).then(res => res.data);
export const verifyAuditChain = (caseId: string) =>
  api.get<ChainVerification>(`/blockchain/${caseId}/verify`).then(res => res.data);
export const getChainStats = (caseId: string) =>
  api.get<ChainStats>(`/blockchain/${caseId}/stats`).then(res => res.data);
