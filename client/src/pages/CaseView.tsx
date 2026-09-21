import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { X, Filter, Target, Activity, AlertTriangle, ChevronUp, ChevronDown, Layers, Info, Fingerprint } from 'lucide-react';
import NetworkGraph from '../components/NetworkGraph';
import EntityBadge from '../components/EntityBadge';
import RiskBadge from '../components/RiskBadge';
import { getCase, getNetwork, getCentrality, getPatterns } from '../services/api';
import { Case, GraphNode, GraphEdge } from '../types';

export default function CaseView() {
  const { id } = useParams<{ id: string }>();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [network, setNetwork] = useState<{ nodes: GraphNode[], edges: GraphEdge[] }>({ nodes: [], edges: [] });
  const [patterns, setPatterns] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('All');

  // Mobile panel visibility toggles
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showInspector, setShowInspector] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [c, net, cent, pats] = await Promise.all([
          getCase(id),
          getNetwork(id),
          getCentrality(id),
          getPatterns(id)
        ]);
        setCaseData(c);
        setPatterns(pats);
        
        // Merge centrality into network nodes for sizing
        const degreeMap = new Map(cent.map((c: any) => [c.id, Number(c.degree) || 1]));
        const enrichedNodes = net.nodes.map((n: GraphNode) => ({
          ...n,
          val: ((degreeMap.get(n.id) as number) || 1) * 2 // Scale factor for visual size
        }));
        
        setNetwork({ nodes: enrichedNodes, edges: net.edges });
      } catch (err) {
        console.error('Error fetching case details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
    setShowInspector(true); // Auto-open inspector on mobile when a node is clicked
  }, []);

  const closeInspector = () => {
    setSelectedNode(null);
    setShowInspector(false);
  };

  const filters = ['All', 'Person', 'Phone', 'Account', 'Location', 'Organization'];

  // Filter entities for sidebar
  const filteredNodes = network.nodes.filter(n => activeFilter === 'All' || n.type === activeFilter);
  // Sort by centrality
  const keySuspects = [...network.nodes].sort((a, b) => (b.val || 0) - (a.val || 0)).slice(0, 5);

  if (loading) return <div className="p-8 text-slate-400">Loading network graph...</div>;
  if (!caseData) return <div className="p-8 text-slate-400">Case not found.</div>;

  return (
    <div className="h-full w-full relative bg-[#06090f] overflow-hidden">
      {/* Tactical Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(rgba(30, 41, 59, 0.5) 1px, transparent 1px)`,
        backgroundSize: '24px 24px'
      }}></div>

      {/* Main Graph Area (Base Layer) */}
      <div className="absolute inset-0 z-0">
        <NetworkGraph 
          nodes={network.nodes} 
          edges={network.edges} 
          onNodeClick={handleNodeClick}
          highlightedNode={selectedNode?.id}
        />
      </div>

      {/* Top Dashboard Header */}
      <div className="absolute top-2 left-2 right-2 md:top-4 md:left-4 md:right-4 h-auto md:h-16 bg-slate-900/60 backdrop-blur-md rounded-xl md:rounded-2xl border border-slate-700/50 shadow-2xl flex items-center px-3 py-2 md:px-6 md:py-0 justify-between z-10">
        <div className="flex-1 min-w-0 pr-2 md:pr-4">
          <h2 className="text-sm md:text-lg font-bold text-white truncate">{caseData.title}</h2>
          <p className="text-[10px] md:text-xs text-slate-400 truncate hidden sm:block">{caseData.description}</p>
        </div>
        <div className="flex gap-4 md:gap-8 flex-shrink-0 items-center">
          <Link
            to={`/audit/${id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/50 rounded-lg text-purple-400 text-xs font-semibold transition-all"
            title="View Blockchain Audit Trail"
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Audit Trail</span>
          </Link>
          <div className="flex flex-col items-end">
            <span className="text-[8px] md:text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Nodes</span>
            <span className="text-sm md:text-lg font-bold text-cyan-400 leading-tight">{network.nodes.length}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] md:text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Links</span>
            <span className="text-sm md:text-lg font-bold text-indigo-400 leading-tight">{network.edges.length}</span>
          </div>
        </div>
      </div>

      {/* ===== MOBILE: Bottom Toggle Buttons ===== */}
      <div className="md:hidden absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        <button
          onClick={() => { setShowLeftPanel(!showLeftPanel); setShowInspector(false); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border shadow-lg transition-colors backdrop-blur-md ${
            showLeftPanel ? 'bg-cyan-600 text-white border-cyan-500' : 'bg-slate-900/80 text-slate-300 border-slate-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Entities
          {showLeftPanel ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
        {selectedNode && (
          <button
            onClick={() => { setShowInspector(!showInspector); setShowLeftPanel(false); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border shadow-lg transition-colors backdrop-blur-md ${
              showInspector ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900/80 text-slate-300 border-slate-700'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            Inspector
            {showInspector ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* ===== LEFT PANEL: Desktop = floating sidebar, Mobile = bottom sheet ===== */}
      {/* Desktop */}
      <div className="hidden md:flex absolute left-4 top-24 bottom-4 w-80 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-2xl flex-col z-10 overflow-hidden">
        <LeftPanelContent
          filters={filters}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          filteredNodes={filteredNodes}
          keySuspects={keySuspects}
          patterns={patterns}
          network={network}
          handleNodeClick={handleNodeClick}
        />
      </div>
      {/* Mobile Bottom Sheet */}
      <div className={`md:hidden fixed inset-x-0 bottom-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 rounded-t-2xl shadow-2xl transition-transform duration-300 ease-in-out ${
        showLeftPanel ? 'translate-y-0' : 'translate-y-full'
      }`} style={{ maxHeight: '65vh' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
          <span className="text-sm font-bold text-white">Entities & Intel</span>
          <button onClick={() => setShowLeftPanel(false)} className="text-slate-400 hover:text-white p-1"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(65vh - 48px)' }}>
          <LeftPanelContent
            filters={filters}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            filteredNodes={filteredNodes}
            keySuspects={keySuspects}
            patterns={patterns}
            network={network}
            handleNodeClick={(node) => { handleNodeClick(node); setShowLeftPanel(false); }}
          />
        </div>
      </div>

      {/* ===== RIGHT INSPECTOR PANEL: Desktop = floating panel, Mobile = bottom sheet ===== */}
      {/* Desktop */}
      <div className={`hidden md:flex absolute right-4 top-24 bottom-4 w-96 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl transition-transform duration-300 ease-in-out z-20 flex-col overflow-hidden ${
        selectedNode ? 'translate-x-0 pointer-events-auto' : 'translate-x-[120%] pointer-events-none'
      }`}>
        {selectedNode && (
          <InspectorContent
            selectedNode={selectedNode}
            network={network}
            closeInspector={closeInspector}
            handleNodeClick={handleNodeClick}
          />
        )}
      </div>
      {/* Mobile Bottom Sheet */}
      <div className={`md:hidden fixed inset-x-0 bottom-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 rounded-t-2xl shadow-2xl transition-transform duration-300 ease-in-out ${
        showInspector && selectedNode ? 'translate-y-0' : 'translate-y-full'
      }`} style={{ maxHeight: '70vh' }}>
        {selectedNode && (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
              <span className="text-sm font-bold text-white truncate pr-2">{selectedNode.label || selectedNode.name}</span>
              <button onClick={closeInspector} className="text-slate-400 hover:text-white p-1"><X className="w-4 h-4" /></button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 48px)' }}>
              <InspectorContent
                selectedNode={selectedNode}
                network={network}
                closeInspector={closeInspector}
                handleNodeClick={(node) => { handleNodeClick(node); }}
                hideHeader
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}


// ==================== Extracted Sub-Components ====================

function LeftPanelContent({
  filters, activeFilter, setActiveFilter, filteredNodes, keySuspects, patterns, network, handleNodeClick
}: {
  filters: string[];
  activeFilter: string;
  setActiveFilter: (f: string) => void;
  filteredNodes: GraphNode[];
  keySuspects: GraphNode[];
  patterns: any;
  network: { nodes: GraphNode[], edges: GraphEdge[] };
  handleNodeClick: (node: GraphNode) => void;
}) {
  return (
    <>
      <div className="p-4 border-b border-slate-700/50 bg-slate-800/20">
        <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Filter className="w-4 h-4" /> Entity Filter
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1 text-xs rounded-full transition-colors border ${
                activeFilter === f 
                  ? 'bg-cyan-900/50 text-cyan-300 border-cyan-500/50' 
                  : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-subtle p-4">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Activity className="w-4 h-4 text-emerald-400" /> Active Entities ({filteredNodes.length})
          </div>
          <div className="flex flex-col gap-2">
            {filteredNodes.slice(0, 50).map(n => (
              <div 
                key={n.id} 
                onClick={() => handleNodeClick(n)}
                className="bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/30 p-2 rounded-lg flex flex-col gap-1 cursor-pointer transition-colors backdrop-blur-sm"
              >
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-slate-200 truncate pr-2">{n.label || n.name}</span>
                  <EntityBadge type={n.type} />
                </div>
                {n.riskLevel && <div className="mt-1"><RiskBadge level={n.riskLevel} /></div>}
              </div>
            ))}
            {filteredNodes.length > 50 && <div className="text-xs text-slate-500 text-center mt-2 font-medium">+ {filteredNodes.length - 50} more items</div>}
          </div>
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Target className="w-4 h-4 text-red-400" /> Key Influencers
          </div>
          <div className="flex flex-col gap-3">
            {keySuspects.map(n => (
              <div key={n.id} className="flex flex-col gap-1 cursor-pointer group" onClick={() => handleNodeClick(n)}>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 truncate w-32 group-hover:text-white transition-colors">{n.label || n.name}</span>
                  <span className="text-slate-500 font-medium">{n.val?.toFixed(1) || 0} score</span>
                </div>
                <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-red-500 h-full rounded-full" style={{ width: `${Math.min(100, (n.val || 0) * 5)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suspicious Patterns Section */}
        {patterns && (patterns.cycles?.length > 0 || patterns.brokers?.length > 0) && (
          <div className="mt-8 border-t border-slate-700/50 pt-6">
            <div className="flex items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Detected Patterns
            </div>
            
            {patterns.cycles?.length > 0 && (
              <div className="mb-5">
                <span className="text-[10px] text-amber-400/80 uppercase tracking-wider mb-2 block font-medium">Possible Cyclic Rings (Money Laundering)</span>
                <div className="flex flex-col gap-2">
                  {patterns.cycles.map((cycle: any[], idx: number) => (
                    <div key={idx} className="bg-amber-900/20 border border-amber-700/30 p-2.5 rounded-lg text-xs text-amber-100 flex flex-wrap gap-1 items-center backdrop-blur-sm">
                      {cycle.map((n, i) => (
                        <span key={i} className="flex items-center">
                          <span className="truncate max-w-[80px]" title={n.name}>{n.name}</span>
                          {i < cycle.length - 1 && <span className="text-amber-600/60 mx-1 font-bold">➔</span>}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {patterns.brokers?.length > 0 && (
              <div>
                <span className="text-[10px] text-indigo-400/80 uppercase tracking-wider mb-2 block font-medium">Key Brokers (Connecting Groups)</span>
                <div className="flex flex-col gap-2">
                  {patterns.brokers.map((b: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-indigo-900/20 hover:bg-indigo-900/40 border border-indigo-700/30 p-2.5 rounded-lg cursor-pointer transition-colors backdrop-blur-sm" onClick={() => {
                      const node = network.nodes.find(n => n.id === b.id);
                      if (node) handleNodeClick(node);
                    }}>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-indigo-100 truncate max-w-[140px]">{b.name}</span>
                        <span className="text-[10px] text-indigo-400/60 mt-0.5">Betweenness Score: {b.score}</span>
                      </div>
                      <EntityBadge type={b.type} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}


function InspectorContent({
  selectedNode, network, closeInspector, handleNodeClick, hideHeader = false
}: {
  selectedNode: GraphNode;
  network: { nodes: GraphNode[], edges: GraphEdge[] };
  closeInspector: () => void;
  handleNodeClick: (node: GraphNode) => void;
  hideHeader?: boolean;
}) {
  return (
    <div className="flex flex-col h-full">
      {!hideHeader && (
        <div className="p-4 md:p-6 border-b border-slate-700/50 bg-slate-800/30 flex justify-between items-start">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-white mb-3 leading-tight pr-4">{selectedNode.label || selectedNode.name}</h3>
            <div className="flex flex-wrap gap-2 items-center">
              <EntityBadge type={selectedNode.type} />
              {selectedNode.riskLevel && <RiskBadge level={selectedNode.riskLevel} />}
            </div>
          </div>
          <button onClick={closeInspector} className="text-slate-400 hover:text-white p-1.5 bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {hideHeader && (
        <div className="px-4 pt-4 pb-2 flex flex-wrap gap-2 items-center">
          <EntityBadge type={selectedNode.type} />
          {selectedNode.riskLevel && <RiskBadge level={selectedNode.riskLevel} />}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-subtle">
        {(() => {
          const standardKeys = ['id', 'name', 'label', 'type', 'riskLevel', 'val', 'x', 'y', 'vx', 'vy', 'index', 'color'];
          const customProps = Object.entries(selectedNode).filter(([k, v]) => {
            if (standardKeys.includes(k)) return false;
            if (k.startsWith('__')) return false;
            return typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
          });
          
          if (customProps.length === 0) return null;
          
          return (
            <div className="mb-6 md:mb-8">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Extracted Properties</h4>
              <div className="bg-slate-800/40 rounded-xl p-3 md:p-4 border border-slate-700/50 flex flex-col gap-3">
                {customProps.map(([key, value]) => (
                  <div key={key} className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{key.replace(/_/g, ' ')}</span>
                    <span className="text-sm text-slate-200 break-words mt-0.5">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Known Connections</h4>
          <div className="flex flex-col gap-2 md:gap-2.5">
            {network.edges.filter(e => {
              const sourceId = typeof e.source === 'object' ? (e.source as GraphNode).id : e.source;
              const targetId = typeof e.target === 'object' ? (e.target as GraphNode).id : e.target;
              return sourceId === selectedNode.id || targetId === selectedNode.id;
            }).map((edge, idx) => {
              const sourceId = typeof edge.source === 'object' ? (edge.source as GraphNode).id : edge.source;
              const targetId = typeof edge.target === 'object' ? (edge.target as GraphNode).id : edge.target;
              const isSource = sourceId === selectedNode.id;
              const connectedNodeId = isSource ? targetId : sourceId;
              const connectedNode = network.nodes.find(n => n.id === connectedNodeId);
              
              if (!connectedNode) return null;

              return (
                <div key={idx} className="bg-slate-800/40 rounded-xl p-3 md:p-3.5 border border-slate-700/50 hover:bg-slate-800/80 transition-colors cursor-pointer" onClick={() => handleNodeClick(connectedNode)}>
                  <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500">{isSource ? 'Outbound' : 'Inbound'}</span>
                    <span className="text-xs text-cyan-400 font-medium px-2 py-0.5 bg-cyan-900/30 rounded-full border border-cyan-800/50">{edge.relType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 truncate font-medium text-sm pr-2">{connectedNode.label || connectedNode.name}</span>
                    <EntityBadge type={connectedNode.type} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
