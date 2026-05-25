"use client";

import React from 'react';
import Link from 'next/link';
import { X, ExternalLink, ShieldCheck, AlertCircle, FileText, Database, Info, GitBranch } from 'lucide-react';
import { GraphNode, GraphLink } from './KnowledgeGraphCanvas';

interface GraphDetailPanelProps {
  node: GraphNode;
  links: GraphLink[];
  allNodes: GraphNode[];
  workspaceSlug: string;
  onClose: () => void;
}

export default function GraphDetailPanel({ node, links, allNodes, workspaceSlug, onClose }: GraphDetailPanelProps) {
  // Find neighboring connections
  const connections = links
    .map(l => {
      const sId = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
      const tId = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;

      if (sId === node.id) {
        const targetNode = allNodes.find(n => n.id === tId);
        return { node: targetNode, type: l.type, direction: 'outgoing' };
      }
      if (tId === node.id) {
        const sourceNode = allNodes.find(n => n.id === sId);
        return { node: sourceNode, type: l.type, direction: 'incoming' };
      }
      return null;
    })
    .filter((c): c is { node: GraphNode; type: string; direction: string } => c !== null && c.node !== undefined);

  // Studio redirect link resolver
  const getStudioLink = () => {
    const slug = workspaceSlug;
    if (node.type.includes('claim')) {
      return `/${slug}/truth`;
    }
    if (node.type === 'evidence') {
      return `/${slug}/truth`;
    }
    if (node.type === 'boundary') {
      return `/${slug}/truth`;
    }
    if (node.type === 'concept') {
      return `/${slug}/semantic-core`;
    }
    if (node.type === 'canonical_question' || node.type === 'qis_scene') {
      return `/${slug}/semantic-core`;
    }
    return `/${slug}`;
  };

  return (
    <div className="flex flex-col h-full text-slate-300 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-900 mb-6">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-violet-400" />
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Entity Details</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-lg text-slate-500 hover:text-slate-200 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Info */}
      <div className="space-y-5">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-slate-900 text-slate-300 border border-slate-800">
            {node.type.replace('_', ' ')}
          </span>
          <h3 className="text-white text-lg font-bold mt-2 leading-snug">{node.label}</h3>
        </div>

        {/* Studio Link */}
        <Link
          href={getStudioLink()}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-violet-600 hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-600/10 border border-violet-500/20 text-white font-semibold text-xs rounded-xl transition-all"
        >
          <span>Open in Studio</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {/* Claim / Evidence Specific Statuses */}
        {node.type.includes('claim') && (
          <div className="p-4 bg-slate-950/80 border border-slate-900 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-white font-semibold text-xs">Lineage Verification</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              This claim is governed by BSW MeaningOps. It requires verified evidence and safety boundary active rules for publishable status.
            </p>
          </div>
        )}

        {node.type === 'evidence' && (
          <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-semibold text-xs">Verified Source</span>
            </div>
            <p className="text-[11px] text-emerald-500/80 leading-relaxed">
              Clinical trial or research metadata has been cryptographically signed and locked.
            </p>
          </div>
        )}

        {/* Connections Section */}
        <div className="pt-6 border-t border-slate-900">
          <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-slate-500" /> Linked Relationships ({connections.length})
          </h4>

          {connections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 bg-slate-900/10 border border-dashed border-slate-900 rounded-xl">
              <Info className="w-5 h-5 text-slate-700 mb-2" />
              <p className="text-slate-600 text-xs">No active relationships found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {connections.map((conn, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950/40 border border-slate-900/60 rounded-xl flex flex-col gap-1 hover:border-slate-800 transition-all"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 capitalize">{conn.direction}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-mono border border-slate-800">
                      {conn.type.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-slate-300 text-xs font-medium truncate block mt-1">
                    {conn.node.label}
                  </span>
                  <span className="text-[9px] text-slate-600 uppercase tracking-wide mt-0.5 inline-block">
                    {conn.node.type.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
