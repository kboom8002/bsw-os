"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Factory, Target, Layers, FileText, Rocket,
  Loader2, CheckCircle, AlertTriangle, XCircle, ChevronRight,
  Shield, Sparkles, Eye, RefreshCw, ExternalLink, Copy
} from "lucide-react";
import {
  getAnswerFactoryDashboard,
  getAvailableCqScenePairs,
  runAnswerPipeline,
  publishAnswerAsset,
  type AnswerPipelineResult,
} from "@/app/actions/answer-factory";
import { getPatternAttractors } from "@/app/actions/semantic";

// ── 타입 ────────────────────────────────────────────────────────

interface CqScenePair {
  id: string;
  normalized_question: string;
  primary_intent: string;
  risk_level: string;
  cps_score: number;
  scenes: Array<{ id: string; scene_name: string; risk_level: string; readiness_score: number }>;
  existingRun: { status: string; vpa_score: number; ready_to_publish: boolean } | null;
  hasScene: boolean;
}

interface Attractor {
  id: string;
  natural_definition: string;
  type: string[];
  status: string;
}

type Stage = "select" | "mission" | "draft" | "preview" | "publish";

const STAGE_LABELS: Record<Stage, { label: string; icon: React.ReactNode; num: number }> = {
  select: { label: "질문 & Attractor 선택", icon: <Target className="w-4 h-4" />, num: 1 },
  mission: { label: "Answer Mission 컴파일", icon: <Layers className="w-4 h-4" />, num: 2 },
  draft: { label: "Blueprint + 초안 생성", icon: <FileText className="w-4 h-4" />, num: 3 },
  preview: { label: "Answer Asset 미리보기", icon: <Eye className="w-4 h-4" />, num: 4 },
  publish: { label: "발행", icon: <Rocket className="w-4 h-4" />, num: 5 },
};

const STAGES: Stage[] = ["select", "mission", "draft", "preview", "publish"];

export default function AnswerFactoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceSlug = (params?.workspace_slug as string) || "";
  const locale = (params?.locale as string) || "ko";

  // State
  const [wsId, setWsId] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentStage, setCurrentStage] = useState<Stage>("select");

  // Dashboard data
  const [dashboard, setDashboard] = useState<any>(null);
  const [pairs, setPairs] = useState<CqScenePair[]>([]);
  const [attractors, setAttractors] = useState<Attractor[]>([]);

  // Selection state
  const [selectedCqId, setSelectedCqId] = useState("");
  const [selectedSceneId, setSelectedSceneId] = useState("");
  const [selectedAttractorId, setSelectedAttractorId] = useState("");

  // Pipeline state
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<AnswerPipelineResult | null>(null);

  // Publish state
  const [publishing, setPublishing] = useState(false);
  const [publishTargets, setPublishTargets] = useState<("hub" | "tenant_queue")[]>(["hub"]);

  // ── 초기화 ──────────────────────────────────────────────────

  useEffect(() => {
    initPage();
  }, [workspaceSlug]);

  const initPage = async () => {
    setLoading(true);
    try {
      const { resolveWorkspaceSlug } = await import("@/app/actions/workspace");
      const resolvedId = await resolveWorkspaceSlug(workspaceSlug);

      if (resolvedId) {
        setWsId(resolvedId);
        const [dashData, pairData] = await Promise.all([
          getAnswerFactoryDashboard(resolvedId),
          getAvailableCqScenePairs(resolvedId),
        ]);
        setDashboard(dashData);
        setPairs(pairData as CqScenePair[]);
        setAttractors((dashData.attractors || []) as Attractor[]);
      }
    } catch (err) {
      console.error("Failed to init Answer Factory:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── 파이프라인 실행 ──────────────────────────────────────────

  const handleRunPipeline = useCallback(async () => {
    if (!wsId || !selectedCqId || !selectedSceneId) return;

    setPipelineRunning(true);
    setPipelineResult(null);
    setCurrentStage("mission");

    try {
      const result = await runAnswerPipeline({
        workspaceId: wsId,
        canonicalQuestionId: selectedCqId,
        sceneId: selectedSceneId,
        attractorId: selectedAttractorId || undefined,
      });

      setPipelineResult(result);

      if (result.success) {
        // 자동 스테이지 진행
        if (result.draft) setCurrentStage("draft");
        if (result.asset) setCurrentStage("preview");
      }
    } catch (err: any) {
      console.error("Pipeline failed:", err);
      setPipelineResult({ success: false, readyToPublish: false, error: err.message });
    } finally {
      setPipelineRunning(false);
    }
  }, [wsId, selectedCqId, selectedSceneId, selectedAttractorId]);

  // ── 발행 ────────────────────────────────────────────────────

  const handlePublish = useCallback(async () => {
    if (!pipelineResult?.asset?.id || !wsId) return;

    setPublishing(true);
    try {
      const result = await publishAnswerAsset(wsId, pipelineResult.asset.id, publishTargets);
      if (result.success) {
        setCurrentStage("publish");
      }
    } catch (err: any) {
      console.error("Publish failed:", err);
    } finally {
      setPublishing(false);
    }
  }, [wsId, pipelineResult, publishTargets]);

  // ── 선택된 질문/씬 정보 ──────────────────────────────────────

  const selectedCq = pairs.find(p => p.id === selectedCqId);
  const selectedScene = selectedCq?.scenes.find(s => s.id === selectedSceneId);
  const selectedAttractor = attractors.find(a => a.id === selectedAttractorId);

  // ── 렌더링 ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/${locale}/${workspaceSlug}/semantic-core`}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Factory className="w-6 h-6 text-cyan-400" />
            Answer Factory
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Attractor-guided Answer Asset 생성 파이프라인
          </p>
        </div>
        {dashboard?.stats && (
          <div className="ml-auto flex gap-4 text-sm">
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center">
              <div className="text-lg font-bold text-cyan-400">{dashboard.stats.totalRuns}</div>
              <div className="text-xs text-slate-400">총 실행</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center">
              <div className="text-lg font-bold text-emerald-400">{dashboard.stats.publishedCount}</div>
              <div className="text-xs text-slate-400">발행됨</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center">
              <div className="text-lg font-bold text-amber-400">{Math.round(dashboard.stats.avgVpa)}</div>
              <div className="text-xs text-slate-400">평균 VPA</div>
            </div>
          </div>
        )}
      </div>

      {/* Stage Progress Bar */}
      <div className="flex items-center gap-1 mb-8 bg-white/5 rounded-2xl p-3 border border-white/10">
        {STAGES.map((stage, i) => {
          const info = STAGE_LABELS[stage];
          const isCurrent = currentStage === stage;
          const isPast = STAGES.indexOf(currentStage) > i;
          return (
            <React.Fragment key={stage}>
              <button
                onClick={() => isPast && setCurrentStage(stage)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isCurrent
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : isPast
                    ? "bg-emerald-500/10 text-emerald-400 cursor-pointer hover:bg-emerald-500/20"
                    : "text-slate-500 cursor-default"
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isPast ? "bg-emerald-500 text-white" : isCurrent ? "bg-cyan-500 text-white" : "bg-white/10"
                }`}>
                  {isPast ? <CheckCircle className="w-4 h-4" /> : info.num}
                </span>
                {info.label}
              </button>
              {i < STAGES.length - 1 && (
                <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isPast ? "text-emerald-400" : "text-slate-600"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Stage Content */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        {/* ── Stage 1: 질문 & Attractor 선택 ── */}
        {currentStage === "select" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              Step 1: 정본 질문 + QIS Scene + Attractor 선택
            </h2>

            {/* CQ 선택 */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">정본 질문 (Canonical Question)</label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pairs.filter(p => p.hasScene).map(pair => (
                  <button
                    key={pair.id}
                    onClick={() => { setSelectedCqId(pair.id); setSelectedSceneId(""); }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedCqId === pair.id
                        ? "bg-cyan-500/10 border-cyan-500/30 text-white"
                        : "bg-white/5 border-white/10 hover:border-white/20 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{pair.normalized_question}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-white/10 px-2 py-0.5 rounded">{pair.primary_intent}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          pair.risk_level === "high" ? "bg-red-500/20 text-red-400" :
                          pair.risk_level === "medium" ? "bg-amber-500/20 text-amber-400" :
                          "bg-emerald-500/20 text-emerald-400"
                        }`}>
                          {pair.risk_level}
                        </span>
                        <span className="text-xs text-cyan-400 font-mono">CPS {pair.cps_score || 0}</span>
                        {pair.existingRun && (
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            pair.existingRun.status === "published" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                          }`}>
                            {pair.existingRun.status === "published" ? "발행됨" : "초안"}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                {pairs.filter(p => p.hasScene).length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>QIS Scene이 연결된 정본 질문이 없습니다.</p>
                    <Link href={`/${locale}/${workspaceSlug}/semantic-core/qis`} className="text-cyan-400 text-sm mt-2 inline-block">
                      QIS Scenes에서 먼저 생성하세요 →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Scene 선택 */}
            {selectedCq && (
              <div>
                <label className="block text-sm text-slate-400 mb-2">QIS Scene 선택</label>
                <div className="grid grid-cols-2 gap-3">
                  {selectedCq.scenes.map(scene => (
                    <button
                      key={scene.id}
                      onClick={() => setSelectedSceneId(scene.id)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        selectedSceneId === scene.id
                          ? "bg-cyan-500/10 border-cyan-500/30"
                          : "bg-white/5 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="font-medium text-sm">{scene.scene_name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400">준비도</span>
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${scene.readiness_score}%` }} />
                        </div>
                        <span className="text-xs text-cyan-400">{scene.readiness_score}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Attractor 선택 (선택사항) */}
            {selectedSceneId && (
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Pattern Attractor (선택사항 — 에셋 생성을 가이드합니다)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setSelectedAttractorId("")}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      !selectedAttractorId
                        ? "bg-slate-500/10 border-slate-500/30"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="text-sm text-slate-400">Attractor 없이 생성</div>
                  </button>
                  {attractors.map(attr => (
                    <button
                      key={attr.id}
                      onClick={() => setSelectedAttractorId(attr.id)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        selectedAttractorId === attr.id
                          ? "bg-purple-500/10 border-purple-500/30"
                          : "bg-white/5 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="font-medium text-sm truncate">{attr.natural_definition}</div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {(Array.isArray(attr.type) ? attr.type : [attr.type]).slice(0, 2).map((t: string) => (
                          <span key={t} className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 실행 버튼 */}
            <div className="flex justify-end pt-4 border-t border-white/10">
              <button
                onClick={handleRunPipeline}
                disabled={!selectedCqId || !selectedSceneId || pipelineRunning}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold
                  hover:from-cyan-400 hover:to-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {pipelineRunning ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> 파이프라인 실행 중...</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> Answer Asset 생성</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Stage 2-3: Mission + Draft 결과 ── */}
        {(currentStage === "mission" || currentStage === "draft") && pipelineResult && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              {currentStage === "mission" ? "Step 2: Answer Mission" : "Step 3: Blueprint + 초안"}
            </h2>

            {/* Mission 요약 */}
            {pipelineResult.mission && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-sm font-medium text-slate-300 mb-3">Answer Mission</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">질문: </span>
                    <span className="text-white">{pipelineResult.mission.question.normalizedQuestion}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">목표: </span>
                    <span className="text-white">{pipelineResult.mission.answerGoal}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Must Include: </span>
                    <span className="text-emerald-400">{pipelineResult.mission.mustInclude?.length || 0}개</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Must Not Do: </span>
                    <span className="text-red-400">{pipelineResult.mission.mustNotInclude?.length || 0}개</span>
                  </div>
                </div>
              </div>
            )}

            {/* Attractor Fit */}
            {pipelineResult.attractorFit && (
              <div className={`rounded-xl p-4 border ${
                pipelineResult.attractorFit.gate === "activate"
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : pipelineResult.attractorFit.gate === "conditional"
                  ? "bg-amber-500/10 border-amber-500/30"
                  : "bg-red-500/10 border-red-500/30"
              }`}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Attractor 적합도</span>
                  <span className="font-mono">{pipelineResult.attractorFit.totalScore.toFixed(1)}점 ({pipelineResult.attractorFit.gate})</span>
                </div>
              </div>
            )}

            {/* Blueprint + Draft */}
            {pipelineResult.draft && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {/* Safety Gate */}
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm ${
                    pipelineResult.draft.safetyPassed
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}>
                    {pipelineResult.draft.safetyPassed ? <Shield className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    Safety Gate: {pipelineResult.draft.safetyPassed ? "PASSED" : "FAILED"}
                  </div>

                  {/* VPA Score */}
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm ${
                    pipelineResult.draft.vpaScore >= 75
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : pipelineResult.draft.vpaScore >= 60
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}>
                    <Sparkles className="w-4 h-4" />
                    VPA: {pipelineResult.draft.vpaScore}/100
                  </div>
                </div>

                {/* Draft Content Preview */}
                <div className="bg-slate-900 rounded-xl p-4 border border-white/10">
                  <div className="text-xs text-slate-500 mb-2">초안 미리보기</div>
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                    {pipelineResult.draft.content}
                  </pre>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setCurrentStage("preview")}
                disabled={!pipelineResult.asset}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold
                  hover:from-cyan-400 hover:to-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Eye className="w-5 h-5" /> Asset 미리보기 →
              </button>
            </div>
          </div>
        )}

        {/* ── Stage 4: Answer Asset 미리보기 ── */}
        {currentStage === "preview" && pipelineResult?.asset && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Eye className="w-5 h-5 text-cyan-400" />
              Step 4: Answer Asset 미리보기
            </h2>

            {/* 7채널 탭 */}
            <div className="space-y-4">
              <div className="text-sm font-medium text-slate-300">채널별 변형 ({pipelineResult.asset.variations?.length || 0}개)</div>
              <div className="grid grid-cols-4 gap-3">
                {(pipelineResult.asset.variations || []).map((v: any, i: number) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="text-xs text-cyan-400 font-mono mb-1">{v.channel}</div>
                    <div className="text-sm text-slate-300 font-medium truncate">{v.title}</div>
                    <div className="text-xs text-slate-500 mt-1 line-clamp-2">{v.body?.substring(0, 80)}...</div>
                  </div>
                ))}
              </div>
            </div>

            {/* HTML Preview */}
            {pipelineResult.page && (
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="text-xs text-slate-400 mb-3 flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs font-mono">HTML Preview</span>
                  <span>{pipelineResult.page.title}</span>
                </div>
                <div
                  className="prose prose-sm max-w-none text-gray-900"
                  dangerouslySetInnerHTML={{ __html: pipelineResult.page.html }}
                />
              </div>
            )}

            {/* JSON-LD Preview */}
            {pipelineResult.jsonLd && (
              <div className="bg-slate-900 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 font-mono">JSON-LD Structured Data</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(pipelineResult.jsonLd, null, 2))}
                    className="text-xs text-cyan-400 flex items-center gap-1 hover:text-cyan-300"
                  >
                    <Copy className="w-3 h-3" /> 복사
                  </button>
                </div>
                <pre className="text-xs text-emerald-400 overflow-x-auto max-h-32">
                  {JSON.stringify(pipelineResult.jsonLd, null, 2)}
                </pre>
              </div>
            )}

            {/* 발행 옵션 */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-sm font-medium text-slate-300 mb-3">발행 대상</div>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={publishTargets.includes("hub")}
                    onChange={e => {
                      if (e.target.checked) setPublishTargets([...publishTargets, "hub"]);
                      else setPublishTargets(publishTargets.filter(t => t !== "hub"));
                    }}
                    className="rounded border-white/20 bg-white/10 text-cyan-500"
                  />
                  <span className="text-sm text-slate-300">aihompy Hub Push</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={publishTargets.includes("tenant_queue")}
                    onChange={e => {
                      if (e.target.checked) setPublishTargets([...publishTargets, "tenant_queue"]);
                      else setPublishTargets(publishTargets.filter(t => t !== "tenant_queue"));
                    }}
                    className="rounded border-white/20 bg-white/10 text-cyan-500"
                  />
                  <span className="text-sm text-slate-300">Tenant Queue 발행</span>
                </label>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStage("draft")}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                ← 이전 단계
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing || !pipelineResult.readyToPublish || publishTargets.length === 0}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  pipelineResult.readyToPublish
                    ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-400 hover:to-green-400"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30 cursor-not-allowed"
                }`}
              >
                {publishing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> 발행 중...</>
                ) : pipelineResult.readyToPublish ? (
                  <><Rocket className="w-5 h-5" /> 발행하기</>
                ) : (
                  <><AlertTriangle className="w-5 h-5" /> Safety/VPA 검증 필요</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Stage 5: 발행 완료 ── */}
        {currentStage === "publish" && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-emerald-400 mb-2">Answer Asset 발행 완료!</h2>
            <p className="text-slate-400 mb-6">
              에셋이 성공적으로 발행되었습니다.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => { setCurrentStage("select"); setPipelineResult(null); }}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4 inline mr-2" />
                새 에셋 생성
              </button>
              <Link
                href={`/${locale}/${workspaceSlug}/semantic-core/pipeline-artifacts`}
                className="px-6 py-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4 inline mr-2" />
                Pipeline Artifacts 보기
              </Link>
            </div>
          </div>
        )}

        {/* Pipeline 실행 중 로딩 */}
        {pipelineRunning && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Answer Asset 생성 중...</h3>
            <p className="text-sm text-slate-400">
              Mission 컴파일 → Blueprint → Draft → Safety Gate → VPA Check → 7채널 에셋 생성
            </p>
            <div className="mt-4 flex justify-center gap-2">
              {["Mission", "Blueprint", "Draft", "Safety", "VPA", "Asset", "Page", "JSON-LD"].map((step, i) => (
                <div key={step} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${i < 3 ? "bg-emerald-400" : "bg-slate-600 animate-pulse"}`} />
                  <span className="text-xs text-slate-500">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 에러 상태 */}
        {pipelineResult && !pipelineResult.success && !pipelineRunning && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mt-4">
            <div className="flex items-center gap-2 text-red-400 font-medium mb-1">
              <XCircle className="w-5 h-5" />
              파이프라인 실행 실패
            </div>
            <p className="text-sm text-red-400/80">{pipelineResult.error}</p>
            <button
              onClick={() => { setPipelineResult(null); setCurrentStage("select"); }}
              className="mt-3 text-sm text-red-400 hover:text-red-300 underline"
            >
              다시 시도
            </button>
          </div>
        )}
      </div>

      {/* Recent Runs */}
      {dashboard?.recentRuns?.length > 0 && currentStage === "select" && (
        <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">최근 실행 이력</h3>
          <div className="space-y-2">
            {dashboard.recentRuns.slice(0, 10).map((run: any) => (
              <div key={run.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${
                    run.status === "published" ? "bg-emerald-400" :
                    run.status === "ready" ? "bg-cyan-400" :
                    run.status === "needs_review" ? "bg-amber-400" : "bg-slate-500"
                  }`} />
                  <span className="text-sm text-slate-300">
                    {run.canonical_questions?.normalized_question || run.canonical_question_id}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {run.vpa_score && <span className="text-cyan-400">VPA {run.vpa_score}</span>}
                  <span className={`px-2 py-0.5 rounded ${
                    run.status === "published" ? "bg-emerald-500/20 text-emerald-400" :
                    run.status === "ready" ? "bg-cyan-500/20 text-cyan-400" :
                    "bg-amber-500/20 text-amber-400"
                  }`}>
                    {run.status}
                  </span>
                  <span>{new Date(run.created_at).toLocaleDateString("ko-KR")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
