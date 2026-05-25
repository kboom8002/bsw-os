"use client";

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Search, Loader2, ZoomIn, ZoomOut, Maximize, Filter, Sliders, Activity } from 'lucide-react';
import GraphDetailPanel from './GraphDetailPanel';

// Dynamically import react-force-graph-2d to avoid SSR issues in Next.js
const ForceGraph2D = dynamic(
  () => import('react-force-graph-2d').then(mod => mod.default),
  { ssr: false, loading: () => (
    <div className="flex flex-col items-center justify-center h-[600px] bg-slate-950/40 rounded-2xl border border-slate-800/80 backdrop-blur-xl">
      <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-4" />
      <p className="text-slate-400 text-sm">Initializing 2D WebGL physics engine...</p>
    </div>
  )}
);

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  layer: 'ontology' | 'kg';
  details?: any;
  x?: number;
  y?: number;
}

export interface GraphLink {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
  layer: 'ontology' | 'kg' | 'lineage';
  details?: any;
}

interface KnowledgeGraphCanvasProps {
  initialNodes: GraphNode[];
  initialLinks: GraphLink[];
  workspaceSlug: string;
}

const TYPE_COLORS: Record<string, string> = {
  // Brand Ontology Layer (Blue-ish / Cool tones)
  strategic_claim: '#3b82f6', // Bright Blue
  operational_claim: '#60a5fa', // Soft Blue
  observed_claim: '#2563eb', // Indigo Blue
  evidence: '#10b981', // Emerald
  boundary: '#f43f5e', // Rose Red
  
  // KG / Semantic Core Layer (Purple-ish / Warm tones)
  concept: '#a855f7', // Violet
  qis_scene: '#d946ef', // Fuchsia
  canonical_question: '#ec4899', // Pink
  capital_node: '#f59e0b', // Amber
};

export default function KnowledgeGraphCanvas({ initialNodes, initialLinks, workspaceSlug }: KnowledgeGraphCanvasProps) {
  const fgRef = useRef<any>(null);
  const [nodes, setNodes] = useState<GraphNode[]>(initialNodes);
  const [links, setLinks] = useState<GraphLink[]>(initialLinks);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  
  // Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOntology, setFilterOntology] = useState(true);
  const [filterKG, setFilterKG] = useState(true);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [highlightedLinks, setHighlightedLinks] = useState<Set<string>>(new Set());
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);

  // Apply layer filters
  useEffect(() => {
    let filteredNodes = initialNodes;
    let filteredLinks = initialLinks;

    if (!filterOntology) {
      filteredNodes = filteredNodes.filter(n => n.layer !== 'ontology');
      filteredLinks = filteredLinks.filter(l => l.layer !== 'ontology');
    }
    if (!filterKG) {
      filteredNodes = filteredNodes.filter(n => n.layer !== 'kg');
      filteredLinks = filteredLinks.filter(l => l.layer !== 'kg');
    }

    setNodes(filteredNodes);
    setLinks(filteredLinks);
    setSelectedNode(null);
  }, [filterOntology, filterKG, initialNodes, initialLinks]);

  // Handle Search & Highlighting
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setHighlightedNodes(new Set());
      return;
    }

    const query = searchQuery.toLowerCase();
    const matches = nodes.filter(n => n.label.toLowerCase().includes(query));
    
    if (matches.length > 0) {
      const matchIds = new Set(matches.map(n => n.id));
      setHighlightedNodes(matchIds);
      
      // Auto zoom to the first matching node
      const firstMatch = matches[0];
      if (fgRef.current && firstMatch.x !== undefined && firstMatch.y !== undefined) {
        fgRef.current.centerAt(firstMatch.x, firstMatch.y, 1000);
        fgRef.current.zoom(2.5, 1000);
      }
    } else {
      setHighlightedNodes(new Set());
    }
  };

  // Zoom helpers
  const zoomIn = () => {
    if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() * 1.3, 400);
  };

  const zoomOut = () => {
    if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() / 1.3, 400);
  };

  const resetZoom = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(800, 50);
    }
  };

  // Click handler
  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
    
    // Zoom and center on the clicked node
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 800);
      fgRef.current.zoom(2.2, 800);
    }

    // Highlight neighborhood
    const neighborIds = new Set<string>([node.id]);
    const linkIds = new Set<string>();

    links.forEach(l => {
      const sId = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
      const tId = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;

      if (sId === node.id) {
        neighborIds.add(tId);
        linkIds.add(l.id);
      } else if (tId === node.id) {
        neighborIds.add(sId);
        linkIds.add(l.id);
      }
    });

    setHighlightedNodes(neighborIds);
    setHighlightedLinks(linkIds);
  };

  const handleCanvasClick = () => {
    setSelectedNode(null);
    setHighlightedNodes(new Set());
    setHighlightedLinks(new Set());
  };

  return (
    <div className="relative flex flex-col lg:flex-row gap-6 w-full h-[720px] bg-slate-950 rounded-3xl border border-slate-900 overflow-hidden shadow-2xl">
      
      {/* Sidebar Controls (Left) */}
      <div className="w-full lg:w-80 flex flex-col p-6 bg-slate-900/30 border-b lg:border-b-0 lg:border-r border-slate-900 backdrop-blur-2xl z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-violet-500/10 rounded-xl">
            <Activity className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-base leading-none">Interactive Graph</h2>
            <p className="text-slate-500 text-xs mt-1">Dual-Layer Brand Intelligence Map</p>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative w-full mb-6">
          <input
            type="text"
            placeholder="Search claims or concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-slate-950/60 border border-slate-800/80 rounded-xl text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
          />
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
          <button type="submit" className="hidden" />
        </form>

        {/* Layer Filters */}
        <div className="mb-6">
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
            <Filter className="w-3.5 h-3.5" /> Filter Layers
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={filterOntology}
                onChange={(e) => setFilterOntology(e.target.checked)}
                className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-950"
              />
              <span className="text-slate-300 text-sm group-hover:text-white transition-colors">
                🔵 Brand Ontology Layer
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={filterKG}
                onChange={(e) => setFilterKG(e.target.checked)}
                className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-950"
              />
              <span className="text-slate-300 text-sm group-hover:text-white transition-colors">
                🟣 Semantic KG Layer
              </span>
            </label>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-auto pt-6 border-t border-slate-900/80">
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5" /> Node Legends
          </h3>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
            {Object.entries(TYPE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2 capitalize">
                <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: color }} />
                <span className="truncate">{type.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative h-full">
        {/* Floating Zoom Controls */}
        <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
          <button
            onClick={zoomIn}
            title="Zoom In"
            className="p-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-all shadow-lg backdrop-blur-md cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={zoomOut}
            title="Zoom Out"
            className="p-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-all shadow-lg backdrop-blur-md cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetZoom}
            title="Zoom to Fit"
            className="p-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-all shadow-lg backdrop-blur-md cursor-pointer"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Force Graph Canvas */}
        <ForceGraph2D
          ref={fgRef}
          graphData={{ nodes, links }}
          width={window.innerWidth > 1024 ? window.innerWidth - 320 - 48 : window.innerWidth - 48}
          height={720}
          backgroundColor="#020617" // Deep Slate 950
          nodeId="id"
          nodeVal={(node: any) => {
            // Strategic and concept nodes are slightly larger
            if (node.type === 'strategic_claim' || node.type === 'capital_node') return 8;
            if (node.type === 'evidence' || node.type === 'boundary') return 6;
            return 4;
          }}
          nodeColor={(node: any) => {
            if (hoverNode && node.id === hoverNode.id) return '#ffffff';
            if (highlightedNodes.size > 0 && !highlightedNodes.has(node.id)) return '#1e293b'; // Dimm non-neighbors
            return TYPE_COLORS[node.type] || '#94a3b8';
          }}
          nodeLabel={(node: any) => `${node.label} [${node.type.replace('_', ' ')}]`}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const label = node.label;
            const fontSize = Math.max(10 / globalScale, 3);
            ctx.font = `${fontSize}px Outfit, Inter, sans-serif`;
            
            // Draw Node Circle with glow on highlight
            const size = node.type === 'strategic_claim' || node.type === 'capital_node' ? 6 : 4;
            const isHighlighted = highlightedNodes.has(node.id) || (highlightedNodes.size === 0 && searchQuery);
            
            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
            ctx.fillStyle = highlightedNodes.size > 0 && !highlightedNodes.has(node.id) 
              ? '#1e293b' 
              : (TYPE_COLORS[node.type] || '#94a3b8');
            ctx.fill();

            // Glow Ring
            if (isHighlighted) {
              ctx.beginPath();
              ctx.arc(node.x, node.y, size + 2, 0, 2 * Math.PI, false);
              ctx.strokeStyle = TYPE_COLORS[node.type] || '#ffffff';
              ctx.lineWidth = 1 / globalScale;
              ctx.stroke();
            }

            // Draw Node Label text
            if (globalScale > 1.2) {
              const textWidth = ctx.measureText(label).width;
              const bckgDimensions = [textWidth, fontSize].map(n => n + 2);
              
              ctx.fillStyle = 'rgba(2, 6, 23, 0.7)';
              ctx.fillRect(node.x - bckgDimensions[0]/2, node.y - size - bckgDimensions[1], bckgDimensions[0], bckgDimensions[1]);
              
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = highlightedNodes.size > 0 && !highlightedNodes.has(node.id) ? '#475569' : '#e2e8f0';
              ctx.fillText(label, node.x, node.y - size - bckgDimensions[1]/2);
            }
          }}
          linkWidth={(link: any) => {
            if (highlightedLinks.has(link.id)) return 3;
            return 1.5;
          }}
          linkColor={(link: any) => {
            if (highlightedLinks.size > 0 && !highlightedLinks.has(link.id)) return '#0f172a';
            return link.layer === 'lineage' ? 'rgba(168, 85, 247, 0.4)' : 'rgba(71, 85, 105, 0.3)';
          }}
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          linkDirectionalParticles={(link: any) => (highlightedLinks.has(link.id) || link.layer === 'lineage' ? 2 : 0)}
          linkDirectionalParticleSpeed={() => 0.006}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleColor={() => '#a855f7'}
          onNodeClick={handleNodeClick}
          onNodeHover={(node: any) => setHoverNode(node)}
          onBackgroundClick={handleCanvasClick}
          cooldownTicks={100}
        />

        {/* Selected Node Sidebar Detail Panel */}
        {selectedNode && (
          <div className="absolute top-0 right-0 h-full w-80 bg-slate-950/95 border-l border-slate-900 backdrop-blur-xl z-20 animate-in slide-in-from-right transition-all">
            <GraphDetailPanel 
              node={selectedNode} 
              links={links} 
              allNodes={nodes} 
              workspaceSlug={workspaceSlug}
              onClose={() => setSelectedNode(null)} 
            />
          </div>
        )}
      </div>

    </div>
  );
}
