import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Shield, ShieldCheck, ShieldAlert, Link2, Hash, Clock, ArrowLeft,
  CheckCircle2, XCircle, Activity, Layers, ChevronRight, Loader2, Fingerprint
} from 'lucide-react';
import { getAuditChain, verifyAuditChain, getCase } from '../services/api';
import { AuditBlock, ChainVerification, Case } from '../types';

// ─── Action color/icon mapping ───────────────────────────────────────────────

const ACTION_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  GENESIS:            { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', label: 'Genesis Block' },
  CASE_CREATED:       { color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/30',   label: 'Case Created' },
  REPORT_INGESTED:    { color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  label: 'Report Ingested' },
  ENTITY_EXTRACTION:  { color: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-500/30', label: 'Entity Extraction' },
  CHAIN_VERIFIED:     { color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   label: 'Chain Verified' },
};

const getActionConfig = (action: string) =>
  ACTION_CONFIG[action] || { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30', label: action };

// ─── Component ───────────────────────────────────────────────────────────────

export default function AuditTrail() {
  const { caseId } = useParams<{ caseId: string }>();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [blocks, setBlocks] = useState<AuditBlock[]>([]);
  const [verification, setVerification] = useState<ChainVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);

  useEffect(() => {
    if (!caseId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [c, chainData] = await Promise.all([
          getCase(caseId),
          getAuditChain(caseId),
        ]);
        setCaseData(c);
        setBlocks(chainData.blocks || []);
      } catch (err) {
        console.error('Error fetching audit data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [caseId]);

  const handleVerify = async () => {
    if (!caseId) return;
    setVerifying(true);
    try {
      const result = await verifyAuditChain(caseId);
      setVerification(result);
      // Refresh chain (verification adds a new block)
      const chainData = await getAuditChain(caseId);
      setBlocks(chainData.blocks || []);
    } catch (err) {
      console.error('Error verifying chain:', err);
    } finally {
      setVerifying(false);
    }
  };

  const truncateHash = (hash: string, length = 12) =>
    hash ? `${hash.substring(0, length)}...${hash.substring(hash.length - 6)}` : '';

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading audit trail...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-subtle">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-6 md:mb-8 ml-10 md:ml-0">
          <Link to={caseId ? `/case/${caseId}` : '/'} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Case
          </Link>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-xl border border-purple-500/30">
                  <Fingerprint className="w-6 h-6 text-purple-400" />
                </div>
                Blockchain Audit Trail
              </h1>
              {caseData && (
                <p className="text-slate-400 mt-2 text-sm">
                  Evidence chain for <span className="text-cyan-400 font-medium">{caseData.title}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 md:p-5">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Total Blocks</span>
            </div>
            <span className="text-2xl md:text-3xl font-bold text-white">{blocks.length}</span>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 md:p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Chain Age</span>
            </div>
            <span className="text-sm md:text-base font-medium text-white">
              {blocks.length > 0 ? new Date(blocks[0].timestamp).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 md:p-5">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Last Activity</span>
            </div>
            <span className="text-sm md:text-base font-medium text-white">
              {blocks.length > 0
                ? new Date(blocks[blocks.length - 1].timestamp).toLocaleTimeString()
                : 'N/A'}
            </span>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 md:p-5">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Difficulty</span>
            </div>
            <span className="text-2xl md:text-3xl font-bold text-white font-mono">00</span>
          </div>
        </div>

        {/* Verification Panel */}
        <div className={`rounded-xl border p-5 md:p-6 mb-6 md:mb-8 transition-all duration-500 ${
          verification === null
            ? 'bg-slate-800/50 border-slate-700/50'
            : verification.valid
              ? 'bg-emerald-500/5 border-emerald-500/30'
              : 'bg-red-500/5 border-red-500/30'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {verification === null ? (
                <div className="p-3 bg-slate-700/50 rounded-xl">
                  <Shield className="w-8 h-8 text-slate-400" />
                </div>
              ) : verification.valid ? (
                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 animate-pulse">
                  <ShieldCheck className="w-8 h-8 text-emerald-400" />
                </div>
              ) : (
                <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/30 animate-pulse">
                  <ShieldAlert className="w-8 h-8 text-red-400" />
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold text-white">
                  {verification === null
                    ? 'Chain Integrity Unverified'
                    : verification.valid
                      ? '✓ Chain Integrity Verified'
                      : '✗ Chain Integrity Compromised'}
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  {verification === null
                    ? 'Run a full verification to check all block hashes and chain linkage.'
                    : verification.valid
                      ? `All ${verification.totalBlocks} blocks verified. Every hash is valid and the chain is unbroken.`
                      : verification.brokenReason || `Chain broken at block #${verification.brokenAt}`}
                </p>
                {verification?.verifiedAt && (
                  <p className="text-xs text-slate-500 mt-1">
                    Verified at {new Date(verification.verifiedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleVerify}
              disabled={verifying}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex-shrink-0 ${
                verifying
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40'
              }`}
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Verify Chain
                </>
              )}
            </button>
          </div>
        </div>

        {/* Block Explorer */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-purple-400" />
            Block Explorer
          </h2>

          {blocks.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
              <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No audit blocks recorded yet.</p>
              <p className="text-slate-500 text-sm mt-1">Blocks will appear as you create cases, upload reports, and extract entities.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-0">
              {blocks.map((block, idx) => {
                let parsedData: any = {};
                try { parsedData = JSON.parse(block.data); } catch {}
                const actionConfig = getActionConfig(parsedData.action || 'UNKNOWN');
                const isExpanded = expandedBlock === block.index;
                const isLast = idx === blocks.length - 1;

                return (
                  <div key={block.index} className="relative">
                    {/* Chain connector line */}
                    {!isLast && (
                      <div className="absolute left-6 top-[72px] bottom-0 w-[2px] bg-gradient-to-b from-slate-600/50 to-slate-700/30 z-0" />
                    )}

                    <div
                      onClick={() => setExpandedBlock(isExpanded ? null : block.index)}
                      className={`relative z-10 bg-slate-800/40 hover:bg-slate-800/70 border rounded-xl p-4 md:p-5 cursor-pointer transition-all duration-200 mb-3 ${
                        isExpanded ? 'border-cyan-500/40 bg-slate-800/70' : 'border-slate-700/50'
                      } ${
                        verification && !verification.valid && verification.brokenAt === block.index
                          ? 'border-red-500/50 bg-red-500/5'
                          : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Block index badge */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${actionConfig.bg} ${actionConfig.border}`}>
                          <span className={`text-sm font-bold font-mono ${actionConfig.color}`}>#{block.index}</span>
                        </div>

                        {/* Block summary */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-sm font-semibold ${actionConfig.color}`}>{actionConfig.label}</span>
                            {verification && !verification.valid && verification.brokenAt === block.index && (
                              <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/30">
                                <XCircle className="w-3 h-3" /> Broken
                              </span>
                            )}
                            {verification && verification.valid && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(block.timestamp).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1 font-mono">
                              <Hash className="w-3 h-3" />
                              {truncateHash(block.hash)}
                            </span>
                          </div>

                          {/* Action-specific details summary */}
                          {parsedData.details && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {parsedData.details.entitiesAdded !== undefined && (
                                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                  +{parsedData.details.entitiesAdded} entities
                                </span>
                              )}
                              {parsedData.details.relationshipsAdded !== undefined && (
                                <span className="text-xs bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20">
                                  +{parsedData.details.relationshipsAdded} links
                                </span>
                              )}
                              {parsedData.details.reportType && (
                                <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                                  {parsedData.details.reportType}
                                </span>
                              )}
                              {parsedData.details.result && (
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                  parsedData.details.result === 'VALID'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                  {parsedData.details.result}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <ChevronRight className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>

                      {/* Expanded block details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-3 animate-in fade-in duration-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">Block Hash</span>
                              <code className="text-xs text-cyan-400 font-mono break-all">{block.hash}</code>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">Previous Hash</span>
                              <code className="text-xs text-purple-400 font-mono break-all">{block.previousHash}</code>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">Data Hash (SHA-256)</span>
                              <code className="text-xs text-amber-400 font-mono break-all">{block.dataHash}</code>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">Nonce (Proof-of-Work)</span>
                              <code className="text-xs text-emerald-400 font-mono">{block.nonce}</code>
                            </div>
                          </div>

                          {/* Raw payload */}
                          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-2">Block Payload</span>
                            <pre className="text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-40 overflow-y-auto scrollbar-subtle">
                              {JSON.stringify(parsedData, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 md:p-6 mb-8">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            How Blockchain Audit Trail Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-purple-400">1</span>
              </div>
              <div>
                <p className="text-slate-300 font-medium">Immutable Recording</p>
                <p className="text-slate-500 text-xs mt-1">Every evidence action (extraction, report, case) is recorded as a SHA-256 hashed block.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-cyan-400">2</span>
              </div>
              <div>
                <p className="text-slate-300 font-medium">Chain Linkage</p>
                <p className="text-slate-500 text-xs mt-1">Each block contains the hash of the previous block, creating an unbreakable chain of custody.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-emerald-400">3</span>
              </div>
              <div>
                <p className="text-slate-300 font-medium">Tamper Detection</p>
                <p className="text-slate-500 text-xs mt-1">Any modification to any block invalidates all subsequent hashes, instantly revealing tampering.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
