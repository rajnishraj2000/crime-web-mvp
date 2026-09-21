import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { GraphNode, GraphEdge, EntityType } from '../types';

interface NetworkGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick: (node: GraphNode) => void;
  highlightedNode?: string;
}

// Color mapping for professional tactical UI
const typeColors: Record<EntityType, string> = {
  Person: '#06b6d4',     // Cyan
  Phone: '#f59e0b',      // Amber
  Account: '#10b981',    // Emerald
  Location: '#8b5cf6',   // Purple
  Organization: '#ec4899',// Pink
  Vehicle: '#f97316',    // Orange
  Event: '#3b82f6'       // Blue
};

export default function NetworkGraph({ nodes, edges, onNodeClick, highlightedNode }: NetworkGraphProps) {
  const fgRef = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        setDimensions({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Center graph when data changes
  useEffect(() => {
    if (fgRef.current && nodes.length > 0) {
      setTimeout(() => {
        fgRef.current.d3Force('charge').strength(-400);
        fgRef.current.zoomToFit(400, 50);
      }, 500); // Wait for initial layout
    }
  }, [nodes]);

  // react-force-graph expects { nodes, links } — we rename 'edges' to 'links'
  const graphData = useMemo(() => ({ nodes, links: edges }), [nodes, edges]);

  const [hoverNode, setHoverNode] = useState<string | null>(null);

  // Draw embellishments (strokes, labels) AFTER native circle is drawn
  const drawNodeText = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isHighlighted = highlightedNode === node.id;
    const isHovered = hoverNode === node.id;
    const color = typeColors[node.type as EntityType] || '#94a3b8';

    // Calculate exact radius used by native engine: R = sqrt(nodeVal) * nodeRelSize
    const nodeVal = Math.max(4, Math.min(12, (node.val || 2) * 1.5));
    const r = Math.sqrt(nodeVal) * 8; // nodeRelSize is 8

    // Draw stroke (highlighted state)
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
    if (isHighlighted || isHovered) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = (isHovered ? 3 : 2) / globalScale;
      ctx.stroke();
      
      ctx.shadowColor = color;
      ctx.shadowBlur = isHovered ? 20 : 15;
    } else {
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1 / globalScale;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Label drawing logic (always visible as requested)
    const label = node.label || node.name || 'Unknown';
    const fontSize = (isHovered ? 14 : 12) / globalScale;
    ctx.font = `${isHovered ? 'bold ' : ''}${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const textWidth = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(node.x - textWidth/2 - 4, node.y + r + 2, textWidth + 8, fontSize + 6);
    
    ctx.fillStyle = (isHighlighted || isHovered) ? '#ffffff' : '#cbd5e1';
    ctx.fillText(label, node.x, node.y + r + 5);
  }, [highlightedNode, hoverNode]);

  if (nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500 font-medium">
        No network data available. Ensure case has extracted entities.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative outline-none">
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeLabel="label"
        nodeRelSize={8}
        nodeVal={(node: any) => Math.max(4, Math.min(12, (node.val || 2) * 1.5))}
        nodeColor={(node: any) => typeColors[node.type as EntityType] || '#94a3b8'}
        nodeCanvasObjectMode={() => 'after'}
        nodeCanvasObject={drawNodeText}
        linkColor={(link: any) => {
          if (highlightedNode && (link.source.id === highlightedNode || link.target.id === highlightedNode)) {
            return 'rgba(6, 182, 212, 0.8)';
          }
          return 'rgba(148, 163, 184, 0.3)';
        }}
        linkWidth={(link: any) => (highlightedNode && (link.source.id === highlightedNode || link.target.id === highlightedNode) ? 2 : 1)}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        linkCanvasObjectMode={() => 'after'}
        linkCanvasObject={(link: any, ctx, globalScale) => {
          const start = link.source;
          const end = link.target;
          
          if (typeof start !== 'object' || typeof end !== 'object') return;
          
          const textPos = {
            x: start.x + (end.x - start.x) / 2,
            y: start.y + (end.y - start.y) / 2
          };
          
          const relLink = { x: end.x - start.x, y: end.y - start.y };
          let textAngle = Math.atan2(relLink.y, relLink.x);
          if (textAngle > Math.PI / 2) textAngle = -(Math.PI - textAngle);
          if (textAngle < -Math.PI / 2) textAngle = -(-Math.PI - textAngle);
          
          const label = link.relType || link.type || '';
          
          if (label && (globalScale > 1.2 || (highlightedNode && (start.id === highlightedNode || end.id === highlightedNode)))) {
            const fontSize = 10 / globalScale;
            ctx.font = `${fontSize}px Inter, sans-serif`;
            const textWidth = ctx.measureText(label).width;
            
            ctx.save();
            ctx.translate(textPos.x, textPos.y);
            ctx.rotate(textAngle);
            
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.fillRect(-textWidth / 2 - 2, -fontSize / 2 - 2, textWidth + 4, fontSize + 4);
            
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#38bdf8'; // light blue for relationships
            ctx.fillText(label, 0, 0);
            ctx.restore();
          }
        }}
        linkDirectionalParticles={(link: any) => (highlightedNode && (link.source.id === highlightedNode || link.target.id === highlightedNode) ? 2 : 0)}
        linkDirectionalParticleSpeed={0.01}
        cooldownTicks={100}
        onNodeClick={(node) => onNodeClick(node as GraphNode)}
        onNodeHover={(node) => {
          setHoverNode(node ? (node as GraphNode).id : null);
          if (containerRef.current) {
            containerRef.current.style.cursor = node ? 'pointer' : 'grab';
          }
        }}
        backgroundColor="transparent"
        enableNodeDrag={true}
        enableZoomInteraction={true}
      />
    </div>
  );
}
