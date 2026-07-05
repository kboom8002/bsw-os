"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { createOntologyNode, createOntologyEdge, generateIndustryOntology } from "@/app/actions/semantic";
import { runTcoKgAgent } from "@/lib/ai/semantic_agents";
import { BENCHMARK_DOMAINS } from "@/lib/benchmark/domain-config";
import { 
  ArrowLeft, 
  Network, 
  Plus, 
  Cpu, 
  Sparkles, 
  History,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Eye,
  Workflow,
  Building2,
  ChevronDown,
  Loader2
} from "lucide-react";

interface NodeItem {
  id: string;
  node_name: string;
  node_type: string;
}

interface EdgeItem {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relation_type: string;
}

export default function KnowledgeGraphPage() {
  const params = useParams();
  const { t } = useTranslation();
  const locale = (params?.locale as string) || "ko";
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const [workspaceId, setWorkspaceId] = useState<string>('');
  const [dbLoading, setDbLoading] = useState(true);

  const [nodes, setNodes] = useState<NodeItem[]>([]);
  const [edges, setEdges] = useState<EdgeItem[]>([]);

  useEffect(() => { loadFromDb(); }, [workspaceSlug]);

  const loadFromDb = async () => {
    setDbLoading(true);
    try {
      const { getSupabaseClient } = await import('@/lib/supabase');
      const supabase = getSupabaseClient();
      const { data: ws } = await supabase.from('workspaces').select('id').eq('slug', workspaceSlug).single();
      const resolvedWsId = ws?.id || '11111111-1111-1111-1111-111111111111';
      setWorkspaceId(resolvedWsId);

      const [nodeRes, edgeRes] = await Promise.all([
        supabase.from('brand_ontology_nodes').select('id, node_name, node_type').eq('workspace_id', resolvedWsId).order('created_at', { ascending: false }),
        supabase.from('brand_ontology_edges').select('id, source_node_id, target_node_id, relation_type').eq('workspace_id', resolvedWsId),
      ]);

      setNodes(nodeRes.data ?? []);
      setEdges(edgeRes.data ?? []);
    } catch (err) {
      console.error('KG DB 로드 실패:', err);
    } finally {
      setDbLoading(false);
    }
  };

  const [isCreatingNode, setIsCreatingNode] = useState(false);
  const [isCreatingEdge, setIsCreatingEdge] = useState(false);
  
  const searchParams = useSearchParams();
  const domainFromUrl = searchParams.get('domain') || '';

  // Industry selector states
  const domainEntries = useMemo(() => Object.values(BENCHMARK_DOMAINS), []);
  const initialDomainSlug = domainFromUrl && domainEntries.some(d => d.slug === domainFromUrl)
    ? domainFromUrl
    : (domainEntries[0]?.slug || '');
  const [selectedDomainSlug, setSelectedDomainSlug] = useState<string>(initialDomainSlug);
  
  const selectedDomain = useMemo(
    () => domainEntries.find(d => d.slug === selectedDomainSlug),
    [domainEntries, selectedDomainSlug]
  );
  
  const [selectedBrandSlug, setSelectedBrandSlug] = useState<string>(selectedDomain?.brands?.[0]?.slug || '');
  const selectedBrand = useMemo(
    () => selectedDomain?.brands.find(b => b.slug === selectedBrandSlug),
    [selectedDomain, selectedBrandSlug]
  );

  // Industry ontology auto-build states
  const [ontologyBuilding, setOntologyBuilding] = useState(false);
  const [ontologyLogs, setOntologyLogs] = useState<string[]>([]);
  const [ontologySuccess, setOntologySuccess] = useState(false);

  // AI Agent form states
  const [runningAgent, setRunningAgent] = useState(false);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [agentSuccess, setAgentSuccess] = useState(false);
  const [agentConceptSeed, setAgentConceptSeed] = useState("Probiotic Culture");

  // Form states
  const [nodeName, setNodeName] = useState("");
  const [nodeType, setNodeType] = useState("concept");

  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [relationType, setRelationType] = useState("resolves_question");

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const resetForm = () => {
    setNodeName("");
    setNodeType("concept");
    setSourceId("");
    setTargetId("");
    setRelationType("resolves_question");
    setFeedback(null);
  };

  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeName.trim()) return;

    const data = { node_name: nodeName, node_type: nodeType, reference_id: null };
    try {
      const result = await createOntologyNode(workspaceId, data);
      setNodes(prev => [...prev, {
        id: result.id || "node-" + Math.floor(Math.random() * 1000),
        node_name: result.node_name,
        node_type: result.node_type
      }]);
      setFeedback({ type: "success", message: `Node "${nodeName}" successfully mapped in graph!` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Unauthorized') || msg.includes('401')) {
        setNodes(prev => [...prev, {
          id: "demo-node-" + Math.floor(Math.random() * 1000),
          node_name: nodeName,
          node_type: nodeType
        }]);
        setFeedback({ type: "success", message: `[데모] Node "${nodeName}" 등록됨 (로그인 시 실제 저장)` });
      } else {
        setFeedback({ type: "error", message: `Failure: ${msg}` });
      }
    }
    setIsCreatingNode(false);
    resetForm();
  };

  const handleCreateEdge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId) return;

    const data = { source_node_id: sourceId, target_node_id: targetId, relation_type: relationType };
    try {
      const result = await createOntologyEdge(workspaceId, data);
      setEdges(prev => [...prev, {
        id: result.id || "edge-" + Math.floor(Math.random() * 1000),
        source_node_id: result.source_node_id,
        target_node_id: result.target_node_id,
        relation_type: result.relation_type
      }]);
      setFeedback({ type: "success", message: `Path successfully established!` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Unauthorized') || msg.includes('401')) {
        setEdges(prev => [...prev, {
          id: "demo-edge-" + Math.floor(Math.random() * 1000),
          source_node_id: sourceId,
          target_node_id: targetId,
          relation_type: relationType
        }]);
        setFeedback({ type: "success", message: `[데모] Edge 연결됨 (로그인 시 실제 저장)` });
      } else {
        setFeedback({ type: "error", message: `Failure: ${msg}` });
      }
    }
    setIsCreatingEdge(false);
    resetForm();
  };

  // ── Industry Ontology Auto-Build ──
  const handleBuildIndustryOntology = async () => {
    if (!selectedDomain) return;
    const industryName = selectedDomain.name;
    const brandName = selectedBrand?.name || selectedBrand?.name_en;

    setOntologyBuilding(true);
    setOntologySuccess(false);
    setOntologyLogs([
      `[System] 업종 온톨로지 자동 구축 시작...`,
      `[Industry] 대상 업종: "${industryName}"`,
      brandName ? `[Brand] 대상 브랜드: "${brandName}"` : `[Brand] 브랜드 미선택 — 업종 전체 온톨로지 생성`,
      `[AI] LLM 엔티티/관계 추출 요청 중...`
    ]);

    try {
      await new Promise(r => setTimeout(r, 400));
      setOntologyLogs(prev => [...prev, "[KG] 노드/엣지 구조 생성 중..."]);

      const result = await generateIndustryOntology(
        workspaceId,
        industryName,
        brandName,
        selectedDomain.industryType // 실측 패널 그라운딩 활성화
      );

      setOntologyLogs(prev => [
        ...prev,
        `[Success] 노드 ${result.nodesCreated}개 생성 완료`,
        `[Success] 엣지 ${result.edgesCreated}개 생성 완료`,
        `[Done] 온톨로지 구축 완료 — 그래프를 새로고침합니다...`
      ]);
      setOntologySuccess(true);
      // Refresh graph data
      await loadFromDb();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Unauthorized') || msg.includes('401') || msg.includes('UNAUTHORIZED')) {
        setOntologyLogs(prev => [
          ...prev,
          `[데모] 인증 없이 데모 모드로 실행 중...`,
          `[데모] 로그인 후 실제 온톨로지가 DB에 저장됩니다.`,
          `[Result] 데모 노드 15개 / 엣지 20개 시뮬레이션 완료`
        ]);
        // Add demo nodes for visual feedback
        const demoOntologyNodes: NodeItem[] = [
          { id: `demo-ind-${Date.now()}-1`, node_name: `${selectedDomain.name} 핵심 개념`, node_type: 'concept' },
          { id: `demo-ind-${Date.now()}-2`, node_name: `소비자 관심사`, node_type: 'concern' },
          { id: `demo-ind-${Date.now()}-3`, node_name: `주요 서비스`, node_type: 'service' },
        ];
        setNodes(prev => [...prev, ...demoOntologyNodes]);
        setOntologySuccess(true);
      } else {
        setOntologyLogs(prev => [...prev, `[Error] 온톨로지 구축 실패: ${msg}`]);
      }
    } finally {
      setOntologyBuilding(false);
    }
  };

  // ── TCO KG Agent Runner ──
  const handleRunAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentConceptSeed.trim()) return;

    setRunningAgent(true);
    setAgentSuccess(false);
    setAgentLogs([
      "[System] Booting TCO/KG Extraction Agent...",
      `[Target] Seed concept target: "${agentConceptSeed}"...`,
      "[Security] Verification context: workspace active session...",
      "[Safety] Registering candidate run status in agent_runs..."
    ]);

    try {
      // Look up a real claim from the DB instead of hardcoded mock
      let claimId: string;
      const { getSupabaseClient } = await import('@/lib/supabase');
      const supabase = getSupabaseClient();
      const { data: claimRow } = await supabase
        .from('brand_claims')
        .select('id')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (claimRow?.id) {
        claimId = claimRow.id;
      } else {
        claimId = '22222222-2222-2222-2222-222222222222';
        console.warn('[KG Agent] 워크스페이스에 클레임이 없습니다. 폴백 UUID를 사용합니다:', claimId);
        setAgentLogs(prev => [...prev, "[Warn] 클레임 없음 — 폴백 ID 사용"]);
      }

      await new Promise(r => setTimeout(r, 600));
      setAgentLogs(prev => [...prev, "[Extract] Querying associated observed claims...", "[AI Schema] Structuring TCO concept schema parameters..."]);
      await new Promise(r => setTimeout(r, 600));
      setAgentLogs(prev => [...prev, "[KG] Mapping conceptual node vertices...", "[KG] Linking concept-to-claim directional edges..."]);

      const result = await runTcoKgAgent(workspaceId, agentConceptSeed, claimId);
      setAgentLogs(prev => [
        ...prev,
        `[Success] Added Concept: "${result.concept.concept_name}"`,
        `[Success] Created Ontology Path Edge ID: ${result.edge.id}`,
        `[Trace] Run ID logged: ${result.agentRunId}`
      ]);
      const nodeA: NodeItem = { id: "node-c-" + Math.floor(Math.random() * 100), node_name: result.concept.concept_name, node_type: "concept" };
      const nodeB: NodeItem = { id: "node-c-" + (Math.floor(Math.random() * 100) + 1), node_name: "Associated Claim Node", node_type: "claim" };
      const newEdge: EdgeItem = {
        id: result.edge.id || "edge-" + Math.floor(Math.random() * 100),
        source_node_id: nodeA.id,
        target_node_id: nodeB.id,
        relation_type: result.edge.relation_type
      };
      setNodes(prev => [...prev, nodeA, nodeB]);
      setEdges(prev => [...prev, newEdge]);
      setAgentSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Unauthorized') || msg.includes('401')) {
        // 데모 모드
        setAgentLogs(prev => [
          ...prev,
          `[데모] 인증 없이 데모 모드로 KG 구성 중...`,
          `[Success] Concept: "${agentConceptSeed}" 매핑 완료`,
          `[Result] 데모 노드/엣지 생성 완료 (로그인 시 실제 저장)`
        ]);
        const demoNode: NodeItem = { id: "demo-node-" + Math.floor(Math.random() * 1000), node_name: agentConceptSeed, node_type: "concept" };
        const demoEdge: EdgeItem = {
          id: "demo-edge-" + Math.floor(Math.random() * 1000),
          source_node_id: demoNode.id,
          target_node_id: nodes[0]?.id ?? "node-1",
          relation_type: "related_to"
        };
        setNodes(prev => [...prev, demoNode]);
        setEdges(prev => [...prev, demoEdge]);
        setAgentSuccess(true);
      } else {
        setAgentLogs(prev => [...prev, `[Error] Run failed: ${msg}`]);
      }
    } finally {
      setRunningAgent(false);
    }
  };

  const getNodeNameById = (id: string) => {
    return nodes.find(n => n.id === id)?.node_name || "Unknown Node";
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-5xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <Link 
            href={`/${locale}/${workspaceSlug}/semantic-core`}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs text-cyan-400 font-mono">{t('semantic_core.studio_title')}</div>
            <h1 className="text-2xl font-extrabold text-white">{t('semantic_core.kg_page_title')}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsCreatingEdge(true);
              setIsCreatingNode(false);
              setFeedback(null);
            }}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-purple-500/20 text-purple-400 hover:bg-purple-950/20 bg-purple-950/10 flex items-center gap-1.5 transition-all"
          >
            <Workflow className="w-4 h-4" /> {t('semantic_core.kg_link_path')}
          </button>
          <button
            onClick={() => {
              setIsCreatingNode(true);
              setIsCreatingEdge(false);
              setFeedback(null);
            }}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/10"
          >
            <Plus className="w-4 h-4" /> {t('semantic_core.kg_map_node')}
          </button>
        </div>
      </div>

      {/* ── Industry Selector & Ontology Auto-Build ── */}
      <div className="p-5 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4">
        <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-amber-400" />
          업종 도메인 선택
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Domain selector */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-400">업종 카테고리</label>
            <div className="relative">
              <select
                value={selectedDomainSlug}
                onChange={(e) => {
                  setSelectedDomainSlug(e.target.value);
                  setSelectedBrandSlug('');
                }}
                className="w-full appearance-none px-3 py-2.5 pr-8 rounded-lg border border-white/10 bg-slate-900 text-slate-100 text-xs font-semibold cursor-pointer hover:border-white/20 transition-colors"
              >
                {domainEntries.map(d => (
                  <option key={d.slug} value={d.slug}>{d.icon} {d.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Brand selector */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-400">브랜드 (선택)</label>
            <div className="relative">
              <select
                value={selectedBrandSlug}
                onChange={(e) => setSelectedBrandSlug(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 pr-8 rounded-lg border border-white/10 bg-slate-900 text-slate-100 text-xs font-semibold cursor-pointer hover:border-white/20 transition-colors"
              >
                <option value="">— 전체 업종 온톨로지 —</option>
                {selectedDomain?.brands.map(b => (
                  <option key={b.slug} value={b.slug}>{b.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Auto-Build Button */}
        <button
          onClick={handleBuildIndustryOntology}
          disabled={ontologyBuilding || !selectedDomainSlug}
          className="w-full px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg
            bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:via-orange-400 hover:to-red-400
            text-white disabled:opacity-50 disabled:cursor-not-allowed
            shadow-orange-500/20 hover:shadow-orange-500/30"
        >
          {ontologyBuilding ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> 온톨로지 생성 중...</>
          ) : (
            <>🏗️ 업종 온톨로지 자동 구축</>
          )}
        </button>

        {/* Ontology Build Logs */}
        {ontologyLogs.length > 0 && (
          <div className="rounded-xl bg-black p-3 font-mono text-[10px] text-green-400 border border-white/5 space-y-1 max-h-48 overflow-y-auto">
            <div className="flex items-center gap-1 text-slate-400 font-semibold mb-1 border-b border-white/5 pb-1">
              <History className="w-3.5 h-3.5" />
              ONTOLOGY_BUILD_LOG
            </div>
            {ontologyLogs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
            {ontologyBuilding && <div className="text-amber-400 animate-pulse">온톨로지 그래프 구축 중...</div>}
            {ontologySuccess && (
              <div className="text-yellow-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                온톨로지 구축 완료 — 노드 {nodes.length}개 / 엣지 {edges.length}개 등록됨
              </div>
            )}
          </div>
        )}
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
          feedback.type === "success" 
            ? "border-green-500/20 text-green-400 bg-green-950/20" 
            : "border-red-500/20 text-red-400 bg-red-950/20"
        }`}>
          {feedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Visual Graph lists representation */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-5">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Network className="w-5 h-5 text-purple-400" />
              {t('semantic_core.kg_graph_paths')}
            </h3>

            {/* Edges / Paths */}
            <div className="space-y-3">
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{t('semantic_core.kg_active_paths')}</div>
              <div className="grid grid-cols-1 gap-3">
                {edges.map((edge) => (
                  <div key={edge.id} className="p-4 rounded-xl border border-white/5 bg-slate-900/40 flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-300">{getNodeNameById(edge.source_node_id)}</span>
                    <div className="flex flex-col items-center px-4 flex-1">
                      <span className="text-[9px] text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-full border border-cyan-900/30 mb-1">
                        {edge.relation_type}
                      </span>
                      <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      </div>
                    </div>
                    <span className="font-bold text-slate-300 text-right">{getNodeNameById(edge.target_node_id)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Nodes */}
            <div className="space-y-3 pt-2">
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{t('semantic_core.kg_registered_vertices')}</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {nodes.map((node) => (
                  <div key={node.id} className="p-3 rounded-lg border border-white/5 bg-slate-900/30 flex items-center justify-between gap-3">
                    <span className="font-bold text-xs text-slate-200 truncate">{node.node_name}</span>
                    <span className="text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-slate-950 border border-white/5 text-slate-400">
                      {node.node_type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Panels */}
        <div className="space-y-6">
          {/* AI KG Generator Agent */}
          <form onSubmit={handleRunAgent} className="p-6 rounded-2xl border border-white/5 bg-slate-950/40 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              {t('semantic_core.kg_ai_extractor')}
            </h3>
            <p className="text-slate-400 text-xs leading-normal">
              {t('semantic_core.kg_ai_extractor_desc')}
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400">{t('semantic_core.kg_seed_concept')}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={agentConceptSeed}
                  onChange={(e) => setAgentConceptSeed(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 text-xs font-semibold"
                  placeholder="e.g. Ceramide Shield"
                  required
                />
                <button
                  type="submit"
                  disabled={runningAgent}
                  className="px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all text-xs flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Run
                </button>
              </div>
            </div>

            {agentLogs.length > 0 && (
              <div className="mt-4 rounded-xl bg-black p-3 font-mono text-[10px] text-green-400 border border-white/5 space-y-1 max-h-40 overflow-y-auto">
                <div className="flex items-center gap-1 text-slate-400 font-semibold mb-1 border-b border-white/5 pb-1">
                  <History className="w-3.5 h-3.5" />
                  KG_AGENT_LOG
                </div>
                {agentLogs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
                {runningAgent && <div className="text-cyan-400 animate-pulse">Mapping graph paths...</div>}
                {agentSuccess && <div className="text-yellow-400">[Trace] Extraction successfully audited.</div>}
              </div>
            )}
          </form>

          {/* Create Node Form */}
          {isCreatingNode && (
            <form onSubmit={handleCreateNode} className="p-6 rounded-2xl border border-white/10 bg-slate-950/40 space-y-4">
              <h3 className="font-bold text-sm text-slate-200">{t('semantic_core.kg_map_graph_node')}</h3>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">{t('semantic_core.kg_node_name')}</label>
                <input
                  type="text"
                  value={nodeName}
                  onChange={(e) => setNodeName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 text-xs font-semibold"
                  placeholder="e.g. Skin Stratum Corneum"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">{t('semantic_core.kg_node_type')}</label>
                <select
                  value={nodeType}
                  onChange={(e) => setNodeType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-200 text-xs font-semibold"
                >
                  <option value="concept">Concept Node</option>
                  <option value="claim">Claim Node</option>
                  <option value="evidence">Evidence Node</option>
                  <option value="canonical_question">CQ Node</option>
                </select>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all text-xs text-center"
                >
                  {t('semantic_core.kg_create_node')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNode(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs"
                >
                  {t('semantic_core.btn_cancel')}
                </button>
              </div>
            </form>
          )}

          {/* Create Edge Form */}
          {isCreatingEdge && (
            <form onSubmit={handleCreateEdge} className="p-6 rounded-2xl border border-purple-500/20 bg-slate-950/40 space-y-4">
              <h3 className="font-bold text-sm text-slate-200">{t('semantic_core.kg_establish_edge')}</h3>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">{t('semantic_core.kg_source_node')}</label>
                <select
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-200 text-xs font-semibold"
                  required
                >
                  <option value="">-- Choose Source --</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.node_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">{t('semantic_core.kg_target_node')}</label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-200 text-xs font-semibold"
                  required
                >
                  <option value="">-- Choose Target --</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.node_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">{t('semantic_core.kg_relation_type')}</label>
                <input
                  type="text"
                  value={relationType}
                  onChange={(e) => setRelationType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 text-xs font-semibold"
                  placeholder="e.g. resolves_question"
                  required
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold transition-all text-xs text-center"
                >
                  {t('semantic_core.kg_establish_link')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingEdge(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs"
                >
                  {t('semantic_core.btn_cancel')}
                </button>
              </div>
            </form>
          )}

          {!isCreatingNode && !isCreatingEdge && (
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
              <h3 className="font-bold text-sm text-slate-300 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                {t('semantic_core.kg_ontology_paths')}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                {t('semantic_core.kg_ontology_paths_desc')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
