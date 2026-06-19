"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { createQisScene } from "@/app/actions/semantic";
import { runQisGenAgent } from "@/lib/ai/semantic_agents";
import { 
  ArrowLeft, 
  Eye, 
  Plus, 
  Cpu, 
  Sparkles, 
  History,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

interface QisSceneItem {
  id: string;
  canonical_question_id: string;
  scene_name: string;
  query_template: string;
  intent_model: string;
  scenario_context: string;
  risk_level: "low" | "medium" | "high" | "critical";
}

interface CanonicalQuestion {
  id: string;
  normalized_question: string;
}

export default function QisScenesPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const locale = (params?.locale as string) || "ko";
  const { t } = useTranslation();
  const mockWorkspaceId = "11111111-1111-1111-1111-111111111111";

  const [canonicals] = useState<CanonicalQuestion[]>([
    { id: "cq-1", normalized_question: "Is niacinamide safe for inflamed skin barriers?" },
    { id: "cq-2", normalized_question: "What is the recommended daily dosage of niacinamide?" },
    { id: "cq-3", normalized_question: "Are luxury skincare ingredients clinically tested?" }
  ]);

  const [scenes, setScenes] = useState<QisSceneItem[]>([
    {
      id: "scene-1",
      canonical_question_id: "cq-1",
      scene_name: "SEO Mobile Search: Inflamed Barrier Skincare",
      query_template: "safe niacinamide concentration for damaged skin barrier",
      intent_model: "informational_commercial_mix",
      scenario_context: "User has severe redness, searching on mobile, needs immediate safety guarantees and dermatological support references.",
      risk_level: "high"
    },
    {
      id: "scene-2",
      canonical_question_id: "cq-2",
      scene_name: "E-Commerce Checkout: Daily Dose Guide",
      query_template: "how much niacinamide to apply daily",
      intent_model: "transactional",
      scenario_context: "User is on product details page, looking to understand usage instructions before confirming checkout.",
      risk_level: "medium"
    }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [runningAgent, setRunningAgent] = useState(false);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [agentSuccess, setAgentSuccess] = useState(false);

  // Manual Form States
  const [selectedCqId, setSelectedCqId] = useState("");
  const [sceneName, setSceneName] = useState("");
  const [queryTemplate, setQueryTemplate] = useState("");
  const [intentModel, setIntentModel] = useState("informational");
  const [scenarioContext, setScenarioContext] = useState("");
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high" | "critical">("medium");

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const resetForm = () => {
    setSelectedCqId("");
    setSceneName("");
    setQueryTemplate("");
    setIntentModel("informational");
    setScenarioContext("");
    setRiskLevel("medium");
    setFeedback(null);
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCqId) {
      setFeedback({ type: "error", message: "DEPENDENCY BLOCK: QIS Scenes must link to a valid Canonical Question." });
      return;
    }

    try {
      const data = {
        canonical_question_id: selectedCqId,
        scene_name: sceneName,
        query_template: queryTemplate,
        intent_model: intentModel,
        scenario_context: scenarioContext,
        risk_level: riskLevel
      };

      const result = await createQisScene(mockWorkspaceId, data);
      
      const created: QisSceneItem = {
        id: result.id || "scene-" + Math.floor(Math.random() * 1000),
        canonical_question_id: result.canonical_question_id,
        scene_name: result.scene_name,
        query_template: result.query_template,
        intent_model: result.intent_model,
        scenario_context: result.scenario_context,
        risk_level: result.risk_level
      };

      setScenes(prev => [...prev, created]);
      setFeedback({ type: "success", message: `QIS Scene "${sceneName}" successfully created!` });
      setIsCreating(false);
      resetForm();
    } catch (err) {
      setFeedback({ type: "error", message: `Failure: ${(err as Error).message}` });
    }
  };

  const handleRunAgent = async (cqId: string) => {
    const targetCq = canonicals.find(c => c.id === cqId);
    if (!targetCq) return;

    setRunningAgent(true);
    setAgentSuccess(false);
    setAgentLogs([
      "[System] Booting QIS Generation Agent...",
      `[Target] Processing Canonical Question ID: ${cqId}...`,
      "[Security] Verifying workspace permissions...",
      "[Safety] Auditing agent run in agent_runs table with status: 'candidate'..."
    ]);

    try {
      await new Promise(r => setTimeout(r, 600));
      setAgentLogs(prev => [...prev, "[AI] Analysing search intent clusters...", "[AI] Injecting mobile scenario contexts..."]);

      await new Promise(r => setTimeout(r, 600));
      setAgentLogs(prev => [...prev, "[Safety] Enforcing 'high' risk boundary rule...", "[System] Persisting candidate QIS Scene to database..."]);

      const result = await runQisGenAgent(mockWorkspaceId, cqId, targetCq.normalized_question);

      setAgentLogs(prev => [
        ...prev, 
        `[Success] QIS Scene generated: "${result.scene.scene_name}"`,
        `[Trace] Run ID logged: ${result.agentRunId}`
      ]);

      const newScene: QisSceneItem = {
        id: result.scene.id || "scene-" + Math.floor(Math.random() * 1000),
        canonical_question_id: result.scene.canonical_question_id,
        scene_name: result.scene.scene_name,
        query_template: result.scene.query_template,
        intent_model: result.scene.intent_model,
        scenario_context: result.scene.scenario_context,
        risk_level: result.scene.risk_level
      };

      setScenes(prev => [newScene, ...prev]);
      setAgentSuccess(true);
    } catch (err) {
      setAgentLogs(prev => [...prev, `[Error] Run failed: ${(err as Error).message}`]);
    } finally {
      setRunningAgent(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "critical": return "border-red-500/20 text-red-400 bg-red-950/20";
      case "high": return "border-orange-500/20 text-orange-400 bg-orange-950/20";
      case "medium": return "border-yellow-500/20 text-yellow-400 bg-yellow-950/20";
      default: return "border-green-500/20 text-green-400 bg-green-950/20";
    }
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
            <h1 className="text-2xl font-extrabold text-white">{t('semantic_core.qis_page_title')}</h1>
          </div>
        </div>
        <button
          onClick={() => {
            setIsCreating(true);
            setFeedback(null);
          }}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/10"
        >
          <Plus className="w-4 h-4" /> Define QIS Scene
        </button>
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
        {/* Scenes List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Eye className="w-5 h-5 text-green-400" />
              Runtime Intent Contexts (QIS Scenes)
            </h3>

            <div className="space-y-4">
              {scenes.map((scene) => {
                const cq = canonicals.find(c => c.id === scene.canonical_question_id);
                return (
                  <div key={scene.id} className="p-5 rounded-xl border border-white/5 bg-slate-900/60 space-y-4 relative overflow-hidden">
                    <div className="absolute top-4 right-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] uppercase font-mono font-bold ${getRiskColor(scene.risk_level)}`}>
                        {scene.risk_level} RISK
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-white text-sm">{scene.scene_name}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <span className="font-semibold text-cyan-400 font-mono">Linked CQ:</span>
                        {cq ? cq.normalized_question : "Unknown"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/40 p-3 rounded-lg border border-white/5 text-xs">
                      <div>
                        <span className="block font-mono text-[10px] text-slate-500 uppercase mb-0.5">Query Template</span>
                        <span className="font-mono text-slate-300">{scene.query_template}</span>
                      </div>
                      <div>
                        <span className="block font-mono text-[10px] text-slate-500 uppercase mb-0.5">Intent Model</span>
                        <span className="font-mono text-purple-400">{scene.intent_model}</span>
                      </div>
                    </div>

                    <div>
                      <span className="block font-mono text-[10px] text-slate-500 uppercase mb-0.5">Scenario Context Scope</span>
                      <p className="text-xs text-slate-300 leading-normal">{scene.scenario_context}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic Tools Side panel */}
        <div className="space-y-6">
          {/* AI Generator triggers */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/40 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              AI QIS Generation Agent
            </h3>
            <p className="text-slate-400 text-xs leading-normal">
              Select a Canonical Question to let our AI agent dynamically generate standard SEO scenes and intent context parameters.
            </p>

            <div className="space-y-3 pt-2">
              {canonicals.map((cq) => (
                <button
                  key={cq.id}
                  onClick={() => handleRunAgent(cq.id)}
                  disabled={runningAgent}
                  className="w-full text-left p-3 rounded-xl border border-white/10 hover:border-cyan-500/30 hover:bg-cyan-950/10 text-slate-300 font-bold transition-all text-xs flex items-center justify-between disabled:opacity-50"
                >
                  <span className="truncate pr-4">{cq.normalized_question}</span>
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                </button>
              ))}
            </div>

            {/* Run logs */}
            {agentLogs.length > 0 && (
              <div className="mt-4 rounded-xl bg-black p-3.5 font-mono text-[10px] text-green-400 border border-white/5 space-y-1.5 max-h-40 overflow-y-auto">
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1 border-b border-white/5 pb-1">
                  <History className="w-3.5 h-3.5" />
                  QIS_AGENT_LOG
                </div>
                {agentLogs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
                {runningAgent && <div className="text-cyan-400 animate-pulse">Running AI Synthesis...</div>}
                {agentSuccess && <div className="text-yellow-400">[Trace] Registered agent_run candidate.</div>}
              </div>
            )}
          </div>

          {/* Manual creation */}
          {isCreating && (
            <form onSubmit={handleCreateManual} className="p-6 rounded-2xl border border-white/10 bg-slate-950/40 space-y-4">
              <h3 className="font-bold text-sm text-slate-200">Define Manual QIS Scene</h3>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">Canonical Question</label>
                <select
                  value={selectedCqId}
                  onChange={(e) => setSelectedCqId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-200 focus:outline-none text-xs font-semibold"
                  required
                >
                  <option value="">-- Choose Canonical Question --</option>
                  {canonicals.map(cq => (
                    <option key={cq.id} value={cq.id}>{cq.normalized_question.substring(0, 45)}...</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">Scene Name</label>
                <input
                  type="text"
                  value={sceneName}
                  onChange={(e) => setSceneName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-semibold"
                  placeholder="e.g. Mobile User Ingredient Guide"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">Query Template</label>
                <input
                  type="text"
                  value={queryTemplate}
                  onChange={(e) => setQueryTemplate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-mono"
                  placeholder="e.g. is {ingredient} safe"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">Intent Model</label>
                <input
                  type="text"
                  value={intentModel}
                  onChange={(e) => setIntentModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-semibold"
                  placeholder="e.g. informational"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">Scenario Context Scope</label>
                <textarea
                  value={scenarioContext}
                  onChange={(e) => setScenarioContext(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-semibold h-20 resize-none"
                  placeholder="User needs details on skincare ingredients safety profiles..."
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">Risk Safety Evaluation</label>
                <select
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-200 focus:outline-none text-xs font-semibold"
                >
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                  <option value="critical">Critical Risk</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all text-xs text-center"
                >
                  Save Scene
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {!isCreating && (
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
              <h3 className="font-bold text-sm text-slate-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-green-400" />
                Active Safety Guard
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                All QIS scenes mapping critical or high-risk context scopes must satisfy deterministic Claim trace lineage tests before publishable content answers can be served.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
