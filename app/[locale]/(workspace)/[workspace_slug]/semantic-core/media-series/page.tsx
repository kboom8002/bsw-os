"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Newspaper,
  ArrowLeft,
  Sparkles,
  Layers,
  Calendar,
  ShieldCheck,
  Rocket,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Copy,
  ExternalLink,
  RefreshCw,
  Clock,
  TrendingUp,
  Globe,
  FileText,
  Send,
  Eye,
  Check,
  ChevronRight,
  Zap,
} from "lucide-react";
import {
  getWeeklyTop3Questions,
  runBatchPipelineForTop3,
  getEditorialHandoffQueue,
  updateHandoffStatus,
  publishMediaSeriesAsset,
  getLiveScoreboardData,
  type Top3Question,
  type MediaHandoffItem,
  type MediaPartner,
  type SeriesType,
  type HandoffStatus,
  type ScoreboardData,
} from "@/app/actions/media-series";

type TabType = "discovery" | "calendar" | "handoff" | "scoreboard";

export default function MediaSeriesAdminPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const locale = (params?.locale as string) || "ko";

  // State
  const [wsId, setWsId] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("discovery");
  const [selectedDomain, setSelectedDomain] = useState("kbeauty-skincare");
  const [selectedPartner, setSelectedPartner] = useState<MediaPartner>("beauty_economy");

  // Tab 1: Discovery state
  const [top3List, setTop3List] = useState<Top3Question[]>([]);
  const [selectedCqIds, setSelectedCqIds] = useState<string[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchResultMsg, setBatchResultMsg] = useState<string | null>(null);

  // Tab 2 & 3: Handoff state
  const [handoffQueue, setHandoffQueue] = useState<MediaHandoffItem[]>([]);
  const [activeHandoff, setActiveHandoff] = useState<MediaHandoffItem | null>(null);
  const [editorialNotes, setEditorialNotes] = useState("");
  const [publishing, setPublishing] = useState(false);

  // Tab 4: Scoreboard state
  const [scoreboard, setScoreboard] = useState<ScoreboardData | null>(null);
  const [copiedWidget, setCopiedWidget] = useState(false);

  // ── 초기화 ──────────────────────────────────────────────────────────

  useEffect(() => {
    initData();
  }, [workspaceSlug, selectedDomain, selectedPartner]);

  const initData = async () => {
    setLoading(true);
    try {
      const { resolveWorkspaceSlug } = await import("@/app/actions/workspace");
      const resolvedId = (await resolveWorkspaceSlug(workspaceSlug)) || "ws-demo-1";
      setWsId(resolvedId);

      const [top3Data, queueData, scoreboardData] = await Promise.all([
        getWeeklyTop3Questions(resolvedId, selectedDomain),
        getEditorialHandoffQueue(resolvedId, selectedPartner),
        getLiveScoreboardData(resolvedId),
      ]);

      setTop3List(top3Data);
      setSelectedCqIds(top3Data.map((q) => q.id));
      setHandoffQueue(queueData);
      if (queueData.length > 0 && !activeHandoff) {
        setActiveHandoff(queueData[0]);
        setEditorialNotes(queueData[0].editorialNotes || "");
      }
      setScoreboard(scoreboardData);
    } catch (err) {
      console.error("Failed to init Media Series Admin:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── TOP 3 동시 컴파일 (Batch Run) ────────────────────────────────────

  const handleRunBatchPipeline = async () => {
    if (!wsId || selectedCqIds.length === 0) return;

    setBatchRunning(true);
    setBatchResultMsg(null);
    try {
      const res = await runBatchPipelineForTop3({
        workspaceId: wsId,
        canonicalQuestionIds: selectedCqIds,
        mediaPartner: selectedPartner,
        seriesType: "series_b_weekly_top3",
      });

      if (res.success && res.handoffItem) {
        setBatchResultMsg(`✅ 주간 TOP 3 에셋 3건이 성공적으로 컴파일되었습니다! (VPA 평균 ${res.handoffItem.vpaAvgScore}점)`);
        // 큐 새로고침
        const updatedQueue = await getEditorialHandoffQueue(wsId, selectedPartner);
        setHandoffQueue(updatedQueue);
        setActiveHandoff(res.handoffItem);
        setActiveTab("handoff");
      } else {
        setBatchResultMsg(`❌ 컴파일 실패: ${res.error}`);
      }
    } catch (err: any) {
      setBatchResultMsg(`❌ 오류 발생: ${err.message}`);
    } finally {
      setBatchRunning(false);
    }
  };

  // ── 상태 변경 (승인/반려/수정) ────────────────────────────────────────

  const handleStatusChange = async (newStatus: HandoffStatus) => {
    if (!activeHandoff || !wsId) return;

    try {
      const res = await updateHandoffStatus(wsId, activeHandoff.id, newStatus, editorialNotes);
      if (res.success && res.item) {
        setActiveHandoff(res.item);
        const updatedQueue = await getEditorialHandoffQueue(wsId, selectedPartner);
        setHandoffQueue(updatedQueue);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // ── 최종 미디어 발행 ──────────────────────────────────────────────────

  const handlePublishAsset = async () => {
    if (!activeHandoff || !wsId) return;

    setPublishing(true);
    try {
      const res = await publishMediaSeriesAsset(wsId, activeHandoff.id, [selectedPartner, "answerhub"]);
      if (res.success) {
        const updatedQueue = await getEditorialHandoffQueue(wsId, selectedPartner);
        setHandoffQueue(updatedQueue);
        const currentUpdated = updatedQueue.find((i) => i.id === activeHandoff.id);
        if (currentUpdated) setActiveHandoff(currentUpdated);
      }
    } catch (err) {
      console.error("Failed to publish asset:", err);
    } finally {
      setPublishing(false);
    }
  };

  // ── 위젯 코드 복사 ────────────────────────────────────────────────────

  const handleCopyWidget = () => {
    if (scoreboard?.embedWidgetScript) {
      navigator.clipboard.writeText(scoreboard.embedWidgetScript);
      setCopiedWidget(true);
      setTimeout(() => setCopiedWidget(false), 3000);
    }
  };

  // ── 렌더링 ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-8 space-y-8 font-sans max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/${locale}/${workspaceSlug}/semantic-core`}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="text-xs text-cyan-400 font-mono font-bold tracking-wider uppercase mb-1">
              BSW Answer Media Service
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
              <Newspaper className="w-7 h-7 text-cyan-400" />
              미디어 시리즈 연재 & 핸드오프 어드민
            </h1>
          </div>
        </div>

        {/* 미디어 파트너 선택 스위처 */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1.5 rounded-2xl">
          <button
            onClick={() => setSelectedPartner("beauty_economy")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              selectedPartner === "beauty_economy"
                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            뷰티경제 (국내 독점)
          </button>
          <button
            onClick={() => setSelectedPartner("bnt_news_global")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              selectedPartner === "bnt_news_global"
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            BNT뉴스 (글로벌 독점)
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/10 space-x-2">
        <button
          onClick={() => setActiveTab("discovery")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "discovery"
              ? "border-cyan-400 text-cyan-400 bg-cyan-500/10 rounded-t-xl"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Zap className="w-4 h-4" />
          📊 주간 QVS TOP 3 발굴
        </button>

        <button
          onClick={() => setActiveTab("calendar")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "calendar"
              ? "border-cyan-400 text-cyan-400 bg-cyan-500/10 rounded-t-xl"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Calendar className="w-4 h-4" />
          📅 미디어 시리즈 캘린더
        </button>

        <button
          onClick={() => setActiveTab("handoff")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "handoff"
              ? "border-cyan-400 text-cyan-400 bg-cyan-500/10 rounded-t-xl"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4" />
          ✍️ 편집부 검수 & 핸드오프 ({handoffQueue.length})
        </button>

        <button
          onClick={() => setActiveTab("scoreboard")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "scoreboard"
              ? "border-cyan-400 text-cyan-400 bg-cyan-500/10 rounded-t-xl"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          📈 실시간 스코어보드
        </button>
      </div>

      {/* ── Tab 1: 주간 QVS TOP 3 자동 발굴 ── */}
      {activeTab === "discovery" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-2xl p-6">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 text-cyan-400">
                <Zap className="w-5 h-5 text-amber-400" />
                이번 주 가장 가치 높은 TOP 3 질문 (QEP + QVS Engine)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                소비자 시그널 수집 데이터 중 경제적 가치(QVS)가 크고 글로벌 AI 엔진에 미답변 공백(Answer Gap)이 큰 질문 3건을 선출합니다.
              </p>
            </div>

            <button
              onClick={handleRunBatchPipeline}
              disabled={batchRunning || selectedCqIds.length === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-bold
                hover:from-amber-400 hover:to-rose-400 disabled:opacity-40 shadow-lg shadow-amber-500/20 transition-all flex-shrink-0"
            >
              {batchRunning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> 3건 동시 컴파일 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> ⚡ TOP 3 3건 동시 배치 컴파일
                </>
              )}
            </button>
          </div>

          {batchResultMsg && (
            <div
              className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
                batchResultMsg.includes("성공")
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-red-500/10 border-red-500/30 text-red-300"
              }`}
            >
              <span>{batchResultMsg}</span>
              {batchResultMsg.includes("성공") && (
                <button
                  onClick={() => setActiveTab("handoff")}
                  className="text-xs underline font-bold hover:text-white"
                >
                  편집부 핸드오프로 이동 →
                </button>
              )}
            </div>
          )}

          {/* TOP 3 카탈로그 뷰 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {top3List.map((item, index) => {
              const isSelected = selectedCqIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isSelected) setSelectedCqIds(selectedCqIds.filter((id) => id !== item.id));
                    else setSelectedCqIds([...selectedCqIds, item.id]);
                  }}
                  className={`cursor-pointer rounded-2xl p-6 border transition-all relative ${
                    isSelected
                      ? "bg-gradient-to-b from-cyan-950/40 to-slate-900 border-cyan-400/50 shadow-lg shadow-cyan-500/10"
                      : "bg-white/5 border-white/10 hover:border-white/20 opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-sm font-mono">
                      #{index + 1}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 font-mono">
                      QVS ₩{item.qvsAmountKrw.toLocaleString()} (${item.qvsAmountUsd})
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-white mb-4 line-clamp-2 leading-snug">
                    {item.normalizedQuestion}
                  </h3>

                  <div className="space-y-2 text-xs border-t border-white/10 pt-4">
                    <div className="flex justify-between text-slate-400">
                      <span>CPS 스코어:</span>
                      <span className="text-cyan-300 font-mono font-bold">{item.cpsScore}점</span>
                    </div>

                    <div className="flex justify-between text-slate-400">
                      <span>AI Answer Gap:</span>
                      <span className="text-rose-400 font-mono font-bold">{item.aiGapPercentage}% 미답변</span>
                    </div>

                    <div className="flex justify-between text-slate-400">
                      <span>주요 오답/미답변 AI:</span>
                      <span className="text-slate-200">{item.unansweredAiEngines.join(", ")}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-500">{item.recommendedCategory}</span>
                    <span className={`px-2 py-0.5 rounded font-mono ${isSelected ? "text-cyan-400" : "text-slate-600"}`}>
                      {isSelected ? "선택됨 ✅" : "클릭하여 선택"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tab 2: 미디어 시리즈 캘린더 ── */}
      {activeTab === "calendar" && (
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-2 text-cyan-400">
              <Calendar className="w-5 h-5" />
              미디어 연재 2대 시리즈 통합 캘린더
            </h2>
            <p className="text-xs text-slate-400">
              시리즈 A(3막 심층 탐구, 격주 월요일) 및 시리즈 B(주간 QVS TOP 3, 매주 수요일)의 정기 발행 스케줄입니다.
            </p>
          </div>

          <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-white/5 text-xs uppercase text-slate-400 font-mono">
                <tr>
                  <th className="p-4">주차</th>
                  <th className="p-4">발행일</th>
                  <th className="p-4">시리즈 구분</th>
                  <th className="p-4">뷰티경제 (국문) 주제</th>
                  <th className="p-4">BNT뉴스 (한/영) 주제</th>
                  <th className="p-4">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr className="hover:bg-white/5">
                  <td className="p-4 font-mono font-bold text-cyan-400">W01</td>
                  <td className="p-4 font-mono text-slate-400">8/03 (월)</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 text-xs font-bold">시리즈 A (1막)</span>
                  </td>
                  <td className="p-4 font-medium text-white">레티놀 입문 농도와 부작용</td>
                  <td className="p-4 text-slate-300">Korean skincare routine order</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">승인 완료</span>
                  </td>
                </tr>

                <tr className="hover:bg-white/5">
                  <td className="p-4 font-mono font-bold text-cyan-400">W01</td>
                  <td className="p-4 font-mono text-slate-400">8/06 (수)</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-bold">시리즈 B (TOP 3)</span>
                  </td>
                  <td className="p-4 font-medium text-white">주간 AI 앤서 리포트 #W01 TOP 3</td>
                  <td className="p-4 text-slate-300">Weekly K-Beauty Report #W01 TOP 3</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-bold">검수 진행 중</span>
                  </td>
                </tr>

                <tr className="hover:bg-white/5">
                  <td className="p-4 font-mono font-bold text-cyan-400">W02</td>
                  <td className="p-4 font-mono text-slate-400">8/13 (수)</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-bold">시리즈 B (TOP 3)</span>
                  </td>
                  <td className="p-4 font-medium text-white">주간 AI 앤서 리포트 #W02 TOP 3</td>
                  <td className="p-4 text-slate-300">Weekly K-Beauty Report #W02 TOP 3</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-400 text-xs">예약 대기</span>
                  </td>
                </tr>

                <tr className="hover:bg-white/5">
                  <td className="p-4 font-mono font-bold text-cyan-400">W03</td>
                  <td className="p-4 font-mono text-slate-400">8/17 (월)</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 text-xs font-bold">시리즈 A (2막)</span>
                  </td>
                  <td className="p-4 font-medium text-white">레티놀 입문 농도 정본 처방전</td>
                  <td className="p-4 text-slate-300">Korean skincare routine order guide</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-400 text-xs">예약 대기</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 3: 편집부 검수 & 핸드오프 Vault ── */}
      {activeTab === "handoff" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 핸드오프 큐 목록 */}
          <div className="space-y-4">
            <h3 className="font-bold text-base text-white flex items-center justify-between">
              <span>핸드오프 대기 큐 ({handoffQueue.length})</span>
              <button onClick={initData} className="text-xs text-cyan-400 flex items-center gap-1 hover:text-cyan-300">
                <RefreshCw className="w-3.5 h-3.5" /> 새로고침
              </button>
            </h3>

            <div className="space-y-3">
              {handoffQueue.map((item) => {
                const isSelected = activeHandoff?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActiveHandoff(item);
                      setEditorialNotes(item.editorialNotes || "");
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-cyan-500/10 border-cyan-400 text-white"
                        : "bg-white/5 border-white/10 hover:border-white/20 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-mono text-cyan-400 font-bold">
                        {item.seriesType === "series_a_3act" ? "시리즈 A (3막)" : "시리즈 B (TOP 3)"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          item.status === "published"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : item.status === "approved"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {item.status === "published" ? "발행 완료" : item.status === "approved" ? "승인 완료" : "검수 진행 중"}
                      </span>
                    </div>

                    <h4 className="font-semibold text-sm line-clamp-2 mb-2">{item.title}</h4>

                    <div className="flex items-center justify-between text-xs text-slate-400 border-t border-white/5 pt-2">
                      <span>VPA {item.vpaAvgScore}점</span>
                      <span>{new Date(item.createdAt).toLocaleDateString("ko-KR")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 상세 검수 & 승인 패널 */}
          {activeHandoff ? (
            <div className="lg:col-span-2 space-y-6 bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-xs text-cyan-400 font-mono font-bold">
                    {activeHandoff.mediaPartner === "beauty_economy" ? "뷰티경제 (한국어)" : "BNT뉴스 (글로벌)"}
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">{activeHandoff.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      activeHandoff.status === "published"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : activeHandoff.status === "approved"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {activeHandoff.status}
                  </span>
                </div>
              </div>

              {/* 검수 항목 체크리스트 */}
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-900 p-3 rounded-xl border border-white/10">
                  <span className="text-slate-400 block mb-1">Safety Gate:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> PASSED
                  </span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-white/10">
                  <span className="text-slate-400 block mb-1">VPA 품질 점수:</span>
                  <span className="text-cyan-400 font-bold font-mono text-sm">{activeHandoff.vpaAvgScore} / 100점</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-white/10">
                  <span className="text-slate-400 block mb-1">Hreflang 태그:</span>
                  <span className="text-slate-200 font-bold">{activeHandoff.hreflangTags?.length || 0}개 언어 지원</span>
                </div>
              </div>

              {/* 기사 HTML 미리보기 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>AEO 기사 HTML 미리보기</span>
                  <span className="font-mono text-cyan-400">JSON-LD @graph 포함</span>
                </div>

                <div className="bg-slate-900 rounded-xl p-4 border border-white/10 max-h-60 overflow-y-auto font-sans text-sm text-slate-200">
                  <div dangerouslySetInnerHTML={{ __html: activeHandoff.htmlPreview }} />
                </div>
              </div>

              {/* 편집장 리뷰 메모 입력 */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-400">편집장 메모 및 수정 요청사항</label>
                <textarea
                  value={editorialNotes}
                  onChange={(e) => setEditorialNotes(e.target.value)}
                  placeholder="수정 요청사항이나 승인 메모를 작성하세요..."
                  className="w-full h-20 bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* 액션 버튼 */}
              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange("in_review")}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300"
                  >
                    수정 요청 (In Review)
                  </button>

                  <button
                    onClick={() => handleStatusChange("approved")}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30"
                  >
                    편집장 최종 승인 (Approved)
                  </button>
                </div>

                <button
                  onClick={handlePublishAsset}
                  disabled={publishing || activeHandoff.status === "published"}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-sm
                    hover:from-emerald-400 hover:to-green-400 disabled:opacity-40 transition-all shadow-lg shadow-emerald-500/20"
                >
                  {publishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> 발행 중...
                    </>
                  ) : activeHandoff.status === "published" ? (
                    <>
                      <CheckCircle className="w-4 h-4" /> 발행 완료됨
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" /> 🚀 미디어 파트너 원클릭 발행
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 text-center py-20 bg-white/5 border border-white/10 rounded-2xl text-slate-500">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>좌측 큐에서 검수할 항목을 선택하세요.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 4: 실시간 스코어보드 ── */}
      {activeTab === "scoreboard" && scoreboard && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <span className="text-xs text-slate-400 block mb-1">총 수집 시그널</span>
              <span className="text-2xl font-bold font-mono text-cyan-400">
                {scoreboard.totalSignals.toLocaleString()}건
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <span className="text-xs text-slate-400 block mb-1">선점 완료 CQ 수</span>
              <span className="text-2xl font-bold font-mono text-emerald-400">{scoreboard.totalCqs}개</span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <span className="text-xs text-slate-400 block mb-1">주간 QVS 총 가치</span>
              <span className="text-2xl font-bold font-mono text-amber-400">
                ₩{scoreboard.weeklyQvsSumKrw.toLocaleString()}
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <span className="text-xs text-slate-400 block mb-1">평균 AI Citation 획득률</span>
              <span className="text-2xl font-bold font-mono text-pink-400">{scoreboard.aiCitationRate}%</span>
            </div>
          </div>

          {/* 5개 AI 엔진별 Citation 스코어 */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-base text-white">글로벌 5대 AI 엔진별 인용 점수</h3>
            <div className="space-y-3">
              {scoreboard.engineScores.map((item) => (
                <div key={item.engine} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{item.engine}</span>
                    <span className="text-cyan-400 font-mono font-bold">{item.citationRate}% (Gap {item.gapCount}개)</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${item.citationRate}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 미디어 임베드 위젯 생성기 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white">미디어 사이트 임베드 위젯 코드</h3>
              <button
                onClick={handleCopyWidget}
                className="text-xs text-cyan-400 flex items-center gap-1 font-bold hover:text-cyan-300"
              >
                {copiedWidget ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedWidget ? "복사됨!" : "위젯 코드 복사"}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              뷰티경제 및 BNT뉴스 기사 사이트 사이드바나 하단에 부착할 실시간 AI 인용 스코어보드 임베드 태그입니다.
            </p>
            <pre className="bg-slate-950 p-4 rounded-xl text-xs text-emerald-400 font-mono border border-white/10 overflow-x-auto">
              {scoreboard.embedWidgetScript}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
