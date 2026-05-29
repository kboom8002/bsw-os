"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { 
  Building2, 
  ArrowLeft, 
  RefreshCw, 
  Layers, 
  Sparkles, 
  Heart, 
  AlertTriangle, 
  DollarSign, 
  Award,
  Globe
} from "lucide-react";
import { getDomainPacks, getCulturalConcepts } from "@/app/actions/kculture";

// Dynamically import force graph to prevent SSR compile errors
const ForceGraph2D = dynamic(() => import("react-force-graph-2d").then((mod) => mod.default), { ssr: false });

export default function AttractorMapPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const locale = (params?.locale as string) || "ko";
  const workspaceId = "00000000-0000-0000-0000-000000000000";

  const [packs, setPacks] = useState<any[]>([]);
  const [selectedPack, setSelectedPack] = useState<any>(null);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const domainPacks = await getDomainPacks(workspaceId);
      setPacks(domainPacks || []);
      
      if (domainPacks && domainPacks.length > 0) {
        const active = domainPacks[0];
        setSelectedPack(active);
        await loadConceptsForPack(active.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadConceptsForPack = async (packId: string) => {
    try {
      const cc = await getCulturalConcepts(workspaceId, packId);
      setConcepts(cc || []);
      
      // Build nodes and links for the force graph
      if (cc && cc.length > 0) {
        const nodes = cc.map((c: any) => ({
          id: c.concept_id,
          name: c.preferred_label?.ko || c.concept_id,
          val: 8,
          color: getNodeColor(c.concept_type),
          concept: c
        }));

        // Generate semantic relationship edges (links) dynamically
        const links: any[] = [];
        cc.forEach((source: any, i: number) => {
          // 1. Connect concepts of the same type
          cc.forEach((target: any, j: number) => {
            if (i < j && source.concept_type === target.concept_type) {
              links.push({
                source: source.concept_id,
                target: target.concept_id,
                val: 1,
                color: "rgba(255, 255, 255, 0.08)"
              });
            }
          });

          // 2. Connect randomly to ensure network structural connectivity
          const companion = cc[(i + 3) % cc.length];
          if (companion && companion.concept_id !== source.concept_id) {
            links.push({
              source: source.concept_id,
              target: companion.concept_id,
              val: 2,
              color: "rgba(34, 211, 238, 0.15)"
            });
          }
        });

        setGraphData({ nodes, links });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case "ingredients":
      case "fermentation":
        return "#14b8a6"; // Teal
      case "skincare_routine":
      case "culinary_style":
        return "#06b6d4"; // Cyan
      case "skincare_philosophy":
      case "traditional_heritage":
        return "#ec4899"; // Pink
      default:
        return "#6366f1"; // Indigo
    }
  };

  const handlePackSelect = async (pack: any) => {
    setSelectedPack(pack);
    setLoading(true);
    await loadConceptsForPack(pack.id);
    setSelectedNode(null);
    setLoading(false);
  };

  const handleNodeClick = (node: any) => {
    setSelectedNode(node.concept);
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col h-screen font-sans select-none overflow-hidden relative">
      {/* Top navbar */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/${locale}/${workspaceSlug}/kculture`)}
            className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              문화 어트랙터 의미 지도 (Attractor Map)
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">실시간 로딩된 K-Culture 개념 네트워크 어트랙터 시각화</p>
          </div>
        </div>

        {/* Domain selection list */}
        <div className="flex items-center gap-2">
          {packs.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePackSelect(p)}
              className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                selectedPack?.id === p.id 
                  ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" 
                  : "bg-slate-900 border-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Force graph workspace container */}
      <div className="flex-1 w-full h-full relative bg-slate-950 flex items-stretch">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Visualizer canvas */}
            <div className="flex-1 relative bg-slate-950/20">
              {graphData.nodes.length > 0 && (
                <ForceGraph2D
                  graphData={graphData}
                  nodeLabel="name"
                  nodeColor={(node: any) => node.color}
                  nodeVal={(node: any) => node.val}
                  linkWidth={1.5}
                  linkColor={(link: any) => link.color}
                  backgroundColor="#020617"
                  onNodeClick={handleNodeClick}
                  cooldownTicks={100}
                />
              )}

              {/* Legend overlay */}
              <div className="absolute left-6 bottom-6 bg-slate-900/80 border border-white/5 rounded-2xl p-4 space-y-2 z-10 text-[9px] font-semibold text-slate-400 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                  <span>원료 & 발효 (Ingredients & Fermentation)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  <span>루틴 & 스타일 (Routine & Culinary Style)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                  <span>철학 & 전통 (Philosophy & Heritage)</span>
                </div>
              </div>
            </div>

            {/* Concept details sidebar drawer */}
            <div className={`w-80 bg-slate-900 border-l border-white/5 flex flex-col justify-between transition-all duration-300 ${
              selectedNode ? "translate-x-0" : "translate-x-full absolute right-0 top-0 bottom-0 pointer-events-none opacity-0"
            }`}>
              {selectedNode && (
                <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 pointer-events-auto">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-950/50 border border-cyan-800/40 px-2 py-0.5 rounded uppercase">
                      {selectedNode.concept_type}
                    </span>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="text-[10px] text-slate-500 hover:text-white font-bold cursor-pointer"
                    >
                      닫기
                    </button>
                  </div>

                  <div className="space-y-1 text-left">
                    <h2 className="text-lg font-black text-white">{selectedNode.preferred_label?.ko}</h2>
                    <h3 className="text-xs text-slate-400 font-medium font-mono">{selectedNode.preferred_label?.en}</h3>
                  </div>

                  <div className="space-y-2 text-left">
                    <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">개념 정의</h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {selectedNode.definition}
                    </p>
                  </div>

                  {/* Vectors progress metrics */}
                  <div className="space-y-4 text-left border-t border-white/5 pt-4">
                    <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">문화 정량 텐서 벡터</h4>
                    
                    {/* Affective */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 text-rose-400" />
                          정동 공명도 (Affective)
                        </span>
                        <span className="font-bold text-slate-200">{(selectedNode.affective_vector?.premiumness || 0.85) * 100}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5">
                        <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${(selectedNode.affective_vector?.premiumness || 0.85) * 100}%` }} />
                      </div>
                    </div>

                    {/* Commerce */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          상업 전이도 (Commerce)
                        </span>
                        <span className="font-bold text-slate-200">{(selectedNode.commerce_vector?.marketability || 0.9) * 100}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${(selectedNode.commerce_vector?.marketability || 0.9) * 100}%` }} />
                      </div>
                    </div>

                    {/* Risk */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          왜곡 위험성 (Risk)
                        </span>
                        <span className="font-bold text-slate-200">{(selectedNode.risk_vector?.over_exaggeration || 0.1) * 100}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5">
                        <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${(selectedNode.risk_vector?.over_exaggeration || 0.1) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* SSoT Authority sources */}
                  {selectedNode.evidence_sources && selectedNode.evidence_sources.length > 0 && (
                    <div className="space-y-2 text-left border-t border-white/5 pt-4">
                      <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-cyan-400" />
                        SSoT 보증 기록
                      </h4>
                      <div className="bg-slate-950/40 border border-white/5 rounded-xl p-3 text-[10px] text-slate-400 leading-relaxed font-medium">
                        <div>- 유형: {selectedNode.evidence_sources[0].source_type}</div>
                        <div className="mt-1 font-mono text-[9px]">- 출처: {selectedNode.evidence_sources[0].reference}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
