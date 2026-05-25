"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createOntologyNode, createOntologyEdge } from "@/app/actions/semantic";
import { runTcoKgAgent } from "@/lib/ai/semantic_agents";
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
  Workflow
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
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const mockWorkspaceId = "11111111-1111-1111-1111-111111111111";

  const [nodes, setNodes] = useState<NodeItem[]>([
    { id: "node-1", node_name: "Active Niacinamide Complex", node_type: "concept" },
    { id: "node-2", node_name: "Is niacinamide safe for skin barriers?", node_type: "canonical_question" },
    { id: "node-3", node_name: "Niacinamide Clinical Study 2026", node_type: "evidence_item" }
  ]);

  const [edges, setEdges] = useState<EdgeItem[]>([
    { id: "edge-1", source_node_id: "node-1", target_node_id: "node-2", relation_type: "resolves_question" },
    { id: "edge-2", source_node_id: "node-3", target_node_id: "node-1", relation_type: "proves_efficacy" }
  ]);

  const [isCreatingNode, setIsCreatingNode] = useState(false);
  const [isCreatingEdge, setIsCreatingEdge] = useState(false);
  
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

    try {
      const data = {
        node_name: nodeName,
        node_type: nodeType,
        reference_id: null
      };

      const result = await createOntologyNode(mockWorkspaceId, data);
      
      const created: NodeItem = {
        id: result.id || "node-" + Math.floor(Math.random() * 1000),
        node_name: result.node_name,
        node_type: result.node_type
      };

      setNodes(prev => [...prev, created]);
      setFeedback({ type: "success", message: `Node "${nodeName}" successfully mapped in graph!` });
      setIsCreatingNode(false);
      resetForm();
    } catch (err) {
      setFeedback({ type: "error", message: `Failure: ${(err as Error).message}` });
    }
  };

  const handleCreateEdge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId) return;

    try {
      const data = {
        source_node_id: sourceId,
        target_node_id: targetId,
        relation_type: relationType
      };

      const result = await createOntologyEdge(mockWorkspaceId, data);
      
      const created: EdgeItem = {
        id: result.id || "edge-" + Math.floor(Math.random() * 1000),
        source_node_id: result.source_node_id,
        target_node_id: result.target_node_id,
        relation_type: result.relation_type
      };

      setEdges(prev => [...prev, created]);
      setFeedback({ type: "success", message: `Path successfully established!` });
      setIsCreatingEdge(false);
      resetForm();
    } catch (err) {
      setFeedback({ type: "error", message: `Failure: ${(err as Error).message}` });
    }
  };

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
      const mockClaimId = "22222222-2222-2222-2222-222222222222";

      await new Promise(r => setTimeout(r, 600));
      setAgentLogs(prev => [...prev, "[Extract] Querying associated observed claims...", "[AI Schema] Structuring TCO concept schema parameters..."]);

      await new Promise(r => setTimeout(r, 600));
      setAgentLogs(prev => [...prev, "[KG] Mapping conceptual node vertices...", "[KG] Linking concept-to-claim directional edges..."]);

      const result = await runTcoKgAgent(mockWorkspaceId, agentConceptSeed, mockClaimId);

      setAgentLogs(prev => [
        ...prev,
        `[Success] Added Concept: "${result.concept.concept_name}"`,
        `[Success] Created Ontology Path Edge ID: ${result.edge.id}`,
        `[Trace] Run ID logged: ${result.agentRunId}`
      ]);

      // Locally append results
      const nodeA: NodeItem = { id: "node-c-" + Math.floor(Math.random() * 100), node_name: result.concept.concept_name, node_type: "concept" };
      const nodeB: NodeItem = { id: "node-c-" + Math.floor(Math.random() * 100) + 1, node_name: "Associated Claim Node", node_type: "claim" };
      
      const newEdge: EdgeItem = {
        id: result.edge.id || "edge-" + Math.floor(Math.random() * 100),
        source_node_id: nodeA.id,
        target_node_id: nodeB.id,
        relation_type: result.edge.relation_type
      };

      setNodes(prev => [...prev, nodeA, nodeB]);
      setEdges(prev => [...prev, newEdge]);
      setAgentSuccess(true);
    } catch (err) {
      setAgentLogs(prev => [...prev, `[Error] Run failed: ${(err as Error).message}`]);
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
            href={`/${workspaceSlug}/semantic-core`}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs text-cyan-400 font-mono">Semantic Core Studio</div>
            <h1 className="text-2xl font-extrabold text-white">Ontology Knowledge Graph</h1>
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
            <Workflow className="w-4 h-4" /> Link Path
          </button>
          <button
            onClick={() => {
              setIsCreatingNode(true);
              setIsCreatingEdge(false);
              setFeedback(null);
            }}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/10"
          >
            <Plus className="w-4 h-4" /> Map Node
          </button>
        </div>
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
              Graph Paths & Relations Map
            </h3>

            {/* Edges / Paths */}
            <div className="space-y-3">
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Active Path Paths</div>
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
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Registered Node Vertices</div>
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
              AI TCO/KG Extractor Agent
            </h3>
            <p className="text-slate-400 text-xs leading-normal">
              Provide a target seed concept to let our AI agent automatically define concept attributes and connect related graph nodes.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400">Seed Concept Name</label>
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
              <h3 className="font-bold text-sm text-slate-200">Map Graph Node</h3>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">Node Name</label>
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
                <label className="block text-xs font-semibold text-slate-400">Node Type</label>
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
                  Create Node
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNode(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Create Edge Form */}
          {isCreatingEdge && (
            <form onSubmit={handleCreateEdge} className="p-6 rounded-2xl border border-purple-500/20 bg-slate-950/40 space-y-4">
              <h3 className="font-bold text-sm text-slate-200">Establish Relation Edge</h3>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">Source Node</label>
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
                <label className="block text-xs font-semibold text-slate-400">Target Node</label>
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
                <label className="block text-xs font-semibold text-slate-400">Relation Type</label>
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
                  Establish Link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingEdge(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {!isCreatingNode && !isCreatingEdge && (
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
              <h3 className="font-bold text-sm text-slate-300 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                Ontology Paths Mapping
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                By mathematically representing the brand's knowledge structure, BSW-OS provides the logical structure necessary for advanced SEO query resolution engines.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
