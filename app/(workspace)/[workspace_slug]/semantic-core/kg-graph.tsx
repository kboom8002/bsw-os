"use client";

import React, { useState, useEffect } from 'react';

export interface KGNode {
  id: string;
  node_name: string;
  node_type: 'brand' | 'product' | 'ingredient' | 'benefit' | 'claim';
  description?: string;
}

export interface KGEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: string;
}

interface KGGraphProps {
  nodes: KGNode[];
  edges: KGEdge[];
}

export default function KGGraph({ nodes, edges }: KGGraphProps) {
  const [selectedNode, setSelectedNode] = useState<KGNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Auto-select first node if available
  useEffect(() => {
    if (nodes.length > 0 && !selectedNode) {
      setSelectedNode(nodes[0]);
    }
  }, [nodes]);

  const getNodeColor = (type: KGNode['node_type']) => {
    switch (type) {
      case 'brand': return 'from-purple-500 to-indigo-600 border-indigo-400';
      case 'product': return 'from-blue-500 to-cyan-600 border-cyan-400';
      case 'ingredient': return 'from-emerald-500 to-teal-600 border-teal-400';
      case 'benefit': return 'from-pink-500 to-rose-600 border-rose-400';
      case 'claim': return 'from-amber-500 to-orange-600 border-orange-400';
      default: return 'from-gray-500 to-slate-600 border-gray-400';
    }
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 rounded-2xl bg-slate-950/80 border border-slate-800 backdrop-blur-xl shadow-2xl">
      {/* 1. Glassmorphic Knowledge Graph Canvas Layout */}
      <div className="lg:col-span-2 relative h-[500px] rounded-xl bg-slate-900/50 border border-slate-800 overflow-hidden flex flex-col justify-between">
        
        {/* Graph Header indicators */}
        <div className="absolute top-4 left-4 z-10 flex gap-2 flex-wrap">
          {['brand', 'product', 'ingredient', 'benefit', 'claim'].map((t) => (
            <span key={t} className="text-xs px-2.5 py-1 rounded-full border border-slate-800 bg-slate-950/90 text-slate-400 font-mono capitalize">
              <span className={`inline-block w-2.5 h-2.5 rounded-full mr-1.5 bg-gradient-to-r ${getNodeColor(t as any)}`} />
              {t}
            </span>
          ))}
        </div>

        {/* Spatial Node Grid Area */}
        <div className="flex-1 w-full relative flex items-center justify-center p-8 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 w-full max-w-lg z-10">
            {nodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const isHovered = hoveredNode === node.id;

              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className={`relative p-4 rounded-xl text-left border transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 shadow-lg bg-gradient-to-br ${getNodeColor(node.node_type)} ${
                    isSelected 
                      ? 'ring-2 ring-white scale-105 border-white' 
                      : 'border-slate-800/80 opacity-90'
                  }`}
                >
                  <p className="text-xs font-mono text-white/70 uppercase tracking-wider mb-1">{node.node_type}</p>
                  <h4 className="text-sm font-semibold text-white truncate">{node.node_name}</h4>
                  
                  {/* Subtle connection glow indicator */}
                  {isSelected && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-white"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Total stats */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 backdrop-blur text-xs text-slate-500 flex justify-between font-mono">
          <span>NODES: {nodes.length}</span>
          <span>EDGES: {edges.length}</span>
        </div>
      </div>

      {/* 2. Semantic Node Inspector Panel */}
      <div className="p-6 rounded-xl bg-slate-900/30 border border-slate-800/80 flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-white tracking-tight border-b border-slate-800 pb-3 flex items-center justify-between">
          <span>Semantic Inspector</span>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">ON</span>
        </h3>

        {selectedNode ? (
          <div className="flex flex-col gap-4">
            <div>
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider block mb-1">NODE IDENTITY</span>
              <h4 className="text-2xl font-bold text-white tracking-tight">{selectedNode.node_name}</h4>
              <span className="inline-block mt-2 text-xs px-3 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono capitalize">
                {selectedNode.node_type}
              </span>
            </div>

            {selectedNode.description && (
              <div>
                <span className="text-xs font-mono text-slate-500 block mb-1">ONTOLOGY DESCRIPTION</span>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
                  {selectedNode.description}
                </p>
              </div>
            )}

            {/* Render connected relations dynamically */}
            <div>
              <span className="text-xs font-mono text-slate-500 block mb-2">CONNECTED RELATIONSHIPS</span>
              <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                {edges
                  .filter(e => e.source_node_id === selectedNode.id || e.target_node_id === selectedNode.id)
                  .map((edge) => {
                    const isSource = edge.source_node_id === selectedNode.id;
                    const counterpartId = isSource ? edge.target_node_id : edge.source_node_id;
                    const counterpartName = nodes.find(n => n.id === counterpartId)?.node_name || "Unknown Entity";

                    return (
                      <div key={edge.id} className="text-xs p-2.5 rounded-lg bg-slate-950/30 border border-slate-800 flex justify-between items-center text-slate-400 font-mono hover:bg-slate-900/60 transition-colors">
                        <span className="text-indigo-400">{edge.relationship_type}</span>
                        <span className="text-white max-w-[120px] truncate">{counterpartName}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">Select an ontology node to inspect connections and metadata details.</p>
        )}
      </div>
    </div>
  );
}
