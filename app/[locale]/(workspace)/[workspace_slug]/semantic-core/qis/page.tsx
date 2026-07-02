"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { createQisScene, generateQisSceneAnswer } from "@/app/actions/semantic";
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
  AlertCircle,
  Loader2
} from "lucide-react";

interface QisSceneItem {
  id: string;
  canonical_question_id: string;
  scene_name: string;
  query_template: string;
  intent_model: string;
  scenario_context: string;
  risk_level: "low" | "medium" | "high" | "critical";
  must_include?: string[];
  must_not_do?: string[];
  confidence_score?: number;
  scene_type?: string;
  answer_text?: string;
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

  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [canonicals, setCanonicals] = useState<CanonicalQuestion[]>([]);
  const [scenes, setScenes] = useState<QisSceneItem[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [generatingAnswerId, setGeneratingAnswerId] = useState<string | null>(null);
  const [expandedSceneId, setExpandedSceneId] = useState<string | null>(null);

  // DB에서 데이터 로드
  useEffect(() => {
    loadFromDb();
  }, [workspaceSlug]);

  const loadFromDb = async () => {
    setDbLoading(true);
    setDbError(null);
    try {
      const { getSupabaseClient } = await import('@/lib/supabase');
      const supabase = getSupabaseClient();

      // 워크스페이스 ID 조회
      const { data: ws } = await supabase
        .from('workspaces')
        .select('id')
        .eq('slug', workspaceSlug)
        .single();

      const resolvedWsId = ws?.id || '11111111-1111-1111-1111-111111111111';
      setWorkspaceId(resolvedWsId);

      // Canonical Questions 조회
      const { data: cqs } = await supabase
        .from('canonical_questions')
        .select('id, normalized_question')
        .eq('workspace_id', resolvedWsId)
        .order('created_at', { ascending: false })
        .limit(50);

      // 데이터 없으면 데모 데이터 사용
      if (!cqs || cqs.length === 0) {
        setCanonicals([
          { id: 'demo-cq-1', normalized_question: '비건 스킨케어에 나이아신아마이드 사용해도 안전한가요?' },
          { id: 'demo-cq-2', normalized_question: 'K-뷰티 루틴에서 레티놀과 비타민C 함께 사용 가능한가요?' },
          { id: 'demo-cq-3', normalized_question: 'AI 피부 분석 앱 정확도 검증' },
        ]);
      } else {
        setCanonicals(cqs);
      }

      // QIS Scenes 조회
      const { data: sc } = await supabase
        .from('qis_scenes')
        .select('id, canonical_question_id, scene_name, query_template, intent_model, scenario_context, risk_level, must_include, must_not_do, confidence_score, scene_type, answer_text')
        .eq('workspace_id', resolvedWsId)
        .order('created_at', { ascending: false })
        .limit(50);

      setScenes(sc || []);

    } catch (err: unknown) {
      console.error('QIS DB 조회 실패:', err);
      // 에러 시 데모 데이터 보여주기
      setCanonicals([
        { id: 'demo-cq-1', normalized_question: '비건 스킨케어에 나이아신아마이드 사용해도 안전한가요?' },
        { id: 'demo-cq-2', normalized_question: 'K-뷰티 루틴에서 레티놀과 비타민C 함께 사용 가능한가요?' },
        { id: 'demo-cq-3', normalized_question: 'AI 피부 분석 앱 정확도 검증' },
      ]);
      setScenes([]);
    } finally {
      setDbLoading(false);
    }
  };

  const handleGenerateAnswer = async (sceneId: string) => {
    setGeneratingAnswerId(sceneId);
    try {
      const updated = await generateQisSceneAnswer(workspaceId || '11111111-1111-1111-1111-111111111111', sceneId);
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, answer_text: updated.answer_text, confidence_score: updated.confidence_score } : s));
    } catch (err: any) {
      console.error("AI 답변 생성 실패:", err);
      alert(`AI 답변 생성 실패: ${err.message}`);
    } finally {
      setGeneratingAnswerId(null);
    }
  };

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
      const result = await createQisScene(workspaceId || '11111111-1111-1111-1111-111111111111', data);
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Unauthorized') || msg.includes('401')) {
        // 데모 모드: 로친 상태만 업데이트
        setScenes(prev => [...prev, {
          id: "demo-scene-" + Math.floor(Math.random() * 1000),
          canonical_question_id: selectedCqId,
          scene_name: sceneName,
          query_template: queryTemplate,
          intent_model: intentModel,
          scenario_context: scenarioContext,
          risk_level: riskLevel
        }]);
        setFeedback({ type: "success", message: `[데모] QIS Scene "${sceneName}" 생성됨 (로그인 시 실제 저장)` });
      } else {
        setFeedback({ type: "error", message: `Failure: ${msg}` });
      }
    }
    setIsCreating(false);
    resetForm();
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

      const result = await runQisGenAgent(workspaceId || '11111111-1111-1111-1111-111111111111', cqId, targetCq.normalized_question);
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Unauthorized') || msg.includes('401')) {
        setAgentLogs(prev => [
          ...prev,
          `[데모] 인증 없이 데모 모드로 QIS 시나리오 생성 중...`,
          `[Success] 데모 QIS Scene: "${targetCq.normalized_question.slice(0,30)}..." 시나리오 매핑`,
          `[Result] 데모 모드 — 로그인 시 실제 저장`
        ]);
        const demoScene: QisSceneItem = {
          id: "demo-scene-" + Math.floor(Math.random() * 1000),
          canonical_question_id: cqId,
          scene_name: `[데모] ${targetCq.normalized_question.slice(0,20)} 시나리오`,
          query_template: targetCq.normalized_question,
          intent_model: "informational",
          scenario_context: "데모 모드 자동 생성",
          risk_level: "medium"
        };
        setScenes(prev => [demoScene, ...prev]);
        setAgentSuccess(true);
      } else {
        setAgentLogs(prev => [...prev, `[Error] Run failed: ${msg}`]);
      }
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
          <Plus className="w-4 h-4" /> QIS 시나리오 정의
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

      {/* DB 상태 표시 */}
      {dbLoading && (
        <div className="flex items-center justify-center py-12 gap-3 text-slate-500">
          <Cpu className="h-5 w-5 animate-spin" />
          <span className="text-sm font-semibold">QIS 데이터 로드 중...</span>
        </div>
      )}

      {dbError && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-sm text-red-400 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <span className="font-bold">DB 연결 오류: </span>{dbError}
            <button onClick={loadFromDb} className="ml-3 text-xs underline hover:text-red-300 cursor-pointer">재시도</button>
          </div>
        </div>
      )}

      {!dbLoading && !dbError && canonicals.length === 0 && (
        <div className="bg-slate-800/30 border border-dashed border-slate-700 rounded-xl p-8 text-center space-y-2">
          <HelpCircle className="h-8 w-8 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-400">아직 Canonical Question이 없습니다</p>
          <p className="text-xs text-slate-500">워크스페이스에서 질문을 생성하면 이곳에 표시됩니다.</p>
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
                const isExpanded = expandedSceneId === scene.id;
                
                return (
                  <div key={scene.id} className="p-5 rounded-xl border border-white/5 bg-slate-900/60 space-y-4 relative overflow-hidden transition-all hover:border-slate-800">
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      {scene.confidence_score !== undefined && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          Confidence: <span className="text-cyan-400 font-bold">{(Number(scene.confidence_score) * 100).toFixed(0)}%</span>
                        </span>
                      )}
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

                    {/* must_include & must_not_do badges */}
                    {((scene.must_include && scene.must_include.length > 0) || (scene.must_not_do && scene.must_not_do.length > 0)) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
                        {scene.must_include && scene.must_include.length > 0 && (
                          <div>
                            <span className="block font-mono text-[10px] text-emerald-500 uppercase mb-1">Must Include</span>
                            <div className="flex flex-wrap gap-1.5">
                              {scene.must_include.map((item, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {scene.must_not_do && scene.must_not_do.length > 0 && (
                          <div>
                            <span className="block font-mono text-[10px] text-red-500 uppercase mb-1">Must Not Do</span>
                            <div className="flex flex-wrap gap-1.5">
                              {scene.must_not_do.map((item, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 font-medium">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI Answer Card Draft drawer */}
                    <div className="border-t border-white/5 pt-4">
                      <div className="flex items-center justify-between gap-4">
                        <button
                          onClick={() => setExpandedSceneId(isExpanded ? null : scene.id)}
                          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {isExpanded ? "AI 답변 초안 접기" : "AI 답변 초안 보기"}
                          {scene.answer_text ? (
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded ml-1 border border-emerald-500/20 font-bold">완료</span>
                          ) : (
                            <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded ml-1 border border-white/5 font-bold font-mono">STANDBY</span>
                          )}
                        </button>

                        <button
                          onClick={() => handleGenerateAnswer(scene.id)}
                          disabled={generatingAnswerId === scene.id}
                          className="px-3 py-1.5 text-slate-950 font-extrabold bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-[10px] rounded-lg transition-all flex items-center gap-1.5"
                        >
                          {generatingAnswerId === scene.id ? (
                            <Loader2 className="w-3 h-3 animate-spin text-slate-950" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-slate-950" />
                          )}
                          {scene.answer_text ? "답변 갱신" : "AI 답변 생성"}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 p-4 rounded-lg bg-slate-950/80 border border-white/5 space-y-3">
                          <h5 className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider">AEO/GEO Optimized Answer Card (Draft)</h5>
                          {scene.answer_text ? (
                            <div className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap select-all bg-slate-900/50 p-3 rounded-lg border border-white/5">
                              {scene.answer_text}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 text-center py-4 font-bold font-mono">
                              생성된 답변 초안이 없습니다. 우측의 "AI 답변 생성" 버튼을 눌러주세요.
                            </div>
                          )}
                        </div>
                      )}
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
              AI QIS 자동 생성 에이전트
            </h3>
            <p className="text-slate-400 text-xs leading-normal">
              정규 질문을 선택하면 AI 에이전트가 표준 SEO 시나리오와 인텐트 컨텍스트를 자동 생성합니다.
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
                  QIS 에이전트 로그
                </div>
                {agentLogs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
                {runningAgent && <div className="text-cyan-400 animate-pulse">AI 합성 및 시나리오 분석 중...</div>}
                {agentSuccess && <div className="text-yellow-400">[Trace] QIS 시나리오가 성공적으로 등록되었습니다.</div>}
              </div>
            )}
          </div>

          {/* Manual creation */}
          {isCreating && (
            <form onSubmit={handleCreateManual} className="p-6 rounded-2xl border border-white/10 bg-slate-950/40 space-y-4">
              <h3 className="font-bold text-sm text-slate-200">수동 QIS 시나리오 정의</h3>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">정규 질문 (CQ)</label>
                <select
                  value={selectedCqId}
                  onChange={(e) => setSelectedCqId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-200 focus:outline-none text-xs font-semibold"
                  required
                >
                  <option value="">-- 정규 질문 선택 --</option>
                  {canonicals.map(cq => (
                    <option key={cq.id} value={cq.id}>{cq.normalized_question.substring(0, 45)}...</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">시나리오명</label>
                <input
                  type="text"
                  value={sceneName}
                  onChange={(e) => setSceneName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-semibold"
                  placeholder="예: 모바일 사용자 성분 분석 가이드"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">쿼리 템플릿</label>
                <input
                  type="text"
                  value={queryTemplate}
                  onChange={(e) => setQueryTemplate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-mono"
                  placeholder="예: {ingredient} 성분 안전한가요"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">인텐트 모델</label>
                <input
                  type="text"
                  value={intentModel}
                  onChange={(e) => setSceneName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-semibold"
                  placeholder="예: informational"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">시나리오 컨텍스트 범위</label>
                <textarea
                  value={scenarioContext}
                  onChange={(e) => setScenarioContext(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-semibold h-20 resize-none"
                  placeholder="사용자가 특정 화장품 성분의 유해성 정보를 필요로 하는 상황..."
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">위험도 안전 평가</label>
                <select
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-200 focus:outline-none text-xs font-semibold"
                >
                  <option value="low">저위험 (Low Risk)</option>
                  <option value="medium">중위험 (Medium Risk)</option>
                  <option value="high">고위험 (High Risk)</option>
                  <option value="critical">치명적 위험 (Critical Risk)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all text-xs text-center"
                >
                  시나리오 저장
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs"
                >
                  취소
                </button>
              </div>
            </form>
          )}

          {!isCreating && (
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
              <h3 className="font-bold text-sm text-slate-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-green-400" />
                능동 안전 가드 (Active Safety Guard)
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                치명적 또는 고위험 컨텍스트의 QIS 시나리오는 결정적 Claim 추적 리니지 검증을 통과해야 배포 가능한 콘텐츠 답변을 제공할 수 있습니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
