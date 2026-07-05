"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Radio, Filter, Search, Download, RefreshCw, Loader2,
  ChevronLeft, ChevronRight, Database, Layers, MessageSquare,
  BookOpen, Film, Activity, Package, CheckCircle, XCircle,
  AlertTriangle, Clock, TrendingUp, ExternalLink, Copy, Gauge,
  Eye, X
} from "lucide-react";
import {
  getExternalSignalsAction,
  getSearchTrendsAction,
  getQuestionSignalsFilteredAction,
  getSignalStatsSummaryAction,
  getSignalClustersAction,
  getCanonicalQuestionsAction,
  getQisScenesAction,
  getPipelineRunsAction,
  getSupplyPackagesAction,
  exportQuestionSignalsCsvAction,
  exportCanonicalQuestionsCsvAction,
  exportQisScenesCsvAction,
  getSupplyPackageDetailAction,
  getSaturationStatusAction,
  getHubFeedbackLogsAction,
  triggerManualFeedbackPullAction,
} from "@/app/actions/pipeline-artifacts";
import { BENCHMARK_DOMAINS } from "@/lib/benchmark/domain-config";

// ─────────────────────────────────────────────────────────
// 탭 정의
// ─────────────────────────────────────────────────────────
const TABS = [
  { key: "external", label: "외부 시그널", icon: Radio, color: "text-cyan-400" },
  { key: "signals", label: "질문 시그널", icon: Activity, color: "text-violet-400" },
  { key: "clusters", label: "클러스터", icon: Layers, color: "text-emerald-400" },
  { key: "cq", label: "정규 질문(CQ)", icon: BookOpen, color: "text-amber-400" },
  { key: "scenes", label: "QIS Scenes", icon: Film, color: "text-pink-400" },
  { key: "feedback", label: "역방향 피드백", icon: MessageSquare, color: "text-amber-500" },
  { key: "runs", label: "실행 이력", icon: Database, color: "text-blue-400" },
] as const;

type TabKey = typeof TABS[number]["key"];

// ─────────────────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────────────────
export default function PipelineArtifactsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawSlug = params?.workspace_slug as string;
  const workspaceSlug = rawSlug && rawSlug !== "undefined" ? rawSlug : "demo-brand-semantic-lab";
  const domainFromUrl = searchParams.get('domain') || Object.keys(BENCHMARK_DOMAINS)[0];

  const [activeTab, setActiveTab] = useState<TabKey>("signals");
  const [selectedDomain, setSelectedDomain] = useState(domainFromUrl);
  const [loading, setLoading] = useState(false);
  const [saturation, setSaturation] = useState<{ coveragePercent: number; isNearSaturation: boolean; cqCount: number; estimatedPool: number; recommendation?: string } | null>(null);

  // 포화도 조회
  useEffect(() => {
    getSaturationStatusAction(workspaceSlug, selectedDomain)
      .then(s => setSaturation(s))
      .catch(() => setSaturation(null));
  }, [workspaceSlug, selectedDomain]);

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-white">
      {/* 헤더 */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">파이프라인 산출물 관리</h1>
              <p className="text-xs text-white/40">Pipeline Artifacts Dashboard</p>
            </div>
          </div>

          {/* 도메인 선택 */}
          <select
            value={selectedDomain}
            onChange={e => setSelectedDomain(e.target.value)}
            className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            {Object.values(BENCHMARK_DOMAINS).map(d => (
              <option key={d.slug} value={d.slug} className="bg-[#1a1b1f]">
                {d.icon} {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* 포화도 배너 */}
        {saturation && saturation.estimatedPool > 0 && (
          <div className={`mt-3 flex items-center gap-3 px-4 py-2.5 rounded-lg border ${
            saturation.isNearSaturation
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-emerald-500/10 border-emerald-500/20'
          }`}>
            <Gauge className={`w-4 h-4 flex-shrink-0 ${
              saturation.isNearSaturation ? 'text-amber-400' : 'text-emerald-400'
            }`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-white/80">CQ 포화도</span>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden max-w-[200px]">
                  <div
                    className={`h-full rounded-full transition-all ${
                      saturation.isNearSaturation
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    }`}
                    style={{ width: `${Math.min(100, saturation.coveragePercent)}%` }}
                  />
                </div>
                <span className={`text-sm font-bold ${
                  saturation.isNearSaturation ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {saturation.coveragePercent}%
                </span>
                <span className="text-[10px] text-white/30">
                  ({saturation.cqCount} / {saturation.estimatedPool})
                </span>
              </div>
              {saturation.isNearSaturation && saturation.recommendation && (
                <p className="text-[10px] text-amber-400/70 mt-1">
                  ⚠️ {saturation.recommendation}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 탭 네비게이션 */}
        <div className="flex gap-1 mt-4 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${activeTab === tab.key ? tab.color : ""}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="p-6">
        {activeTab === "external" && (
          <ExternalSignalsTab workspaceSlug={workspaceSlug} />
        )}
        {activeTab === "signals" && (
          <QuestionSignalsTab workspaceSlug={workspaceSlug} />
        )}
        {activeTab === "clusters" && (
          <ClustersTab workspaceSlug={workspaceSlug} />
        )}
        {activeTab === "cq" && (
          <CanonicalQuestionsTab workspaceSlug={workspaceSlug} />
        )}
        {activeTab === "scenes" && (
          <QisScenesTab workspaceSlug={workspaceSlug} />
        )}
        {activeTab === "runs" && (
          <RunsTab workspaceSlug={workspaceSlug} selectedDomain={selectedDomain} />
        )}
        {activeTab === "feedback" && (
          <FeedbackTab workspaceSlug={workspaceSlug} selectedDomain={selectedDomain} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 탭1: 외부 시그널
// ─────────────────────────────────────────────────────────
function ExternalSignalsTab({ workspaceSlug }: { workspaceSlug: string }) {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filterConverted, setFilterConverted] = useState<boolean | undefined>(undefined);
  const [filterType, setFilterType] = useState("");
  const [trends, setTrends] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [res, trendRes] = await Promise.all([
      getExternalSignalsAction(workspaceSlug, page, 20, {
        sourceType: filterType || undefined,
        isConverted: filterConverted,
      }),
      getSearchTrendsAction(workspaceSlug, 10),
    ]);
    setData(res.data);
    setTotal(res.total);
    setTrends(trendRes);
    setLoading(false);
  }, [workspaceSlug, page, filterConverted, filterType]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="전체 외부 시그널" value={total} color="cyan" icon={Radio} />
        <StatCard label="미변환" value={data.filter(d => !d.is_converted).length} color="amber" icon={AlertTriangle} />
        <StatCard label="변환 완료" value={data.filter(d => d.is_converted).length} color="emerald" icon={CheckCircle} />
      </div>

      {/* 트렌드 키워드 */}
      {trends.length > 0 && (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium">DataLab 수집 트렌드</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {trends.slice(0, 10).map((t, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs">
                <span className="text-cyan-300">{t.keyword}</span>
                <span className="text-white/30">{Math.round(t.relative_volume)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 필터 */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={filterType}
          onChange={e => { setFilterType(e.target.value); setPage(1); }}
          className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
        >
          <option value="">전체 소스</option>
          <option value="naver_news">네이버 뉴스</option>
          <option value="community">커뮤니티</option>
          <option value="rss">RSS</option>
        </select>
        <select
          value={filterConverted === undefined ? "" : String(filterConverted)}
          onChange={e => { setFilterConverted(e.target.value === "" ? undefined : e.target.value === "true"); setPage(1); }}
          className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
        >
          <option value="">전체</option>
          <option value="false">미변환</option>
          <option value="true">변환 완료</option>
        </select>
        <button onClick={() => load()} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 hover:text-white">
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {/* 시그널 목록 */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-cyan-400" /></div>
      ) : (
        <div className="space-y-2">
          {data.map(signal => (
            <div key={signal.id} className="bg-white/5 rounded-lg p-3 border border-white/5 hover:border-white/10 transition-all">
              <div className="flex items-start gap-3">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${
                  signal.is_converted ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                }`}>
                  {signal.is_converted ? "변환됨" : "미변환"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 line-clamp-2">{signal.content}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-white/30">{signal.source_type}</span>
                    {signal.url && (
                      <a href={signal.url} target="_blank" rel="noopener" className="text-xs text-cyan-400/60 hover:text-cyan-400 flex items-center gap-0.5">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <span className="text-xs text-white/20">{new Date(signal.collected_at || "").toLocaleDateString("ko-KR")}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="text-center py-8 text-white/30 text-sm">외부 시그널이 없습니다. 파이프라인을 실행하거나 소스를 수집해주세요.</div>
          )}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 탭2: 질문 시그널
// ─────────────────────────────────────────────────────────
function QuestionSignalsTab({ workspaceSlug }: { workspaceSlug: string }) {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterGate, setFilterGate] = useState("");
  const [filterYmyl, setFilterYmyl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [res, s] = await Promise.all([
      getQuestionSignalsFilteredAction(workspaceSlug, {
        status: filterStatus || undefined,
        gateStatus: filterGate || undefined,
        isYmyl: filterYmyl === "" ? undefined : filterYmyl === "true",
        searchQuery: searchQuery || undefined,
      }, page, 30),
      getSignalStatsSummaryAction(workspaceSlug),
    ]);
    setData(res.data);
    setTotal(res.total);
    setStats(s);
    setLoading(false);
  }, [workspaceSlug, page, filterStatus, filterGate, filterYmyl, searchQuery]);

  useEffect(() => { load(); }, [load]);

  const handleExport = async () => {
    setExporting(true);
    const csv = await exportQuestionSignalsCsvAction(workspaceSlug);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `question_signals_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    setExporting(false);
  };

  const totalPages = Math.ceil(total / 30);

  const gateColor = (g: string) => {
    if (g === "Go") return "bg-emerald-500/20 text-emerald-400";
    if (g === "Watch") return "bg-amber-500/20 text-amber-400";
    return "bg-red-500/20 text-red-400";
  };

  const statusColor = (s: string) => {
    if (s === "promoted") return "bg-violet-500/20 text-violet-400";
    if (s === "ignored") return "bg-white/5 text-white/30";
    return "bg-blue-500/20 text-blue-400";
  };

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="전체" value={stats.total} color="violet" icon={Activity} />
          <StatCard label="Go" value={stats.go} color="emerald" icon={CheckCircle} />
          <StatCard label="Watch" value={stats.watch} color="amber" icon={AlertTriangle} />
          <StatCard label="No-Go" value={stats.noGo} color="red" icon={XCircle} />
        </div>
      )}

      {/* 필터 & 내보내기 */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="질문 검색..."
            className="bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500 w-48"
          />
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white">
          <option value="">전체 상태</option>
          <option value="mined">수집</option>
          <option value="promoted">승격</option>
          <option value="ignored">무시</option>
        </select>
        <select value={filterGate} onChange={e => { setFilterGate(e.target.value); setPage(1); }}
          className="bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white">
          <option value="">전체 Gate</option>
          <option value="Go">Go</option>
          <option value="Watch">Watch</option>
          <option value="No-Go">No-Go</option>
        </select>
        <select value={filterYmyl} onChange={e => { setFilterYmyl(e.target.value); setPage(1); }}
          className="bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white">
          <option value="">전체</option>
          <option value="true">YMYL만</option>
          <option value="false">비YMYL</option>
        </select>
        <button onClick={() => load()} className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 hover:text-white">
          <RefreshCw className="w-3 h-3" />
        </button>
        <button onClick={handleExport} disabled={exporting}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 hover:bg-emerald-500/20 ml-auto">
          {exporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
          CSV
        </button>
      </div>

      {/* 테이블 */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-violet-400" /></div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left px-3 py-2 text-white/40 font-medium">질문</th>
                <th className="text-left px-3 py-2 text-white/40 font-medium w-16">CPS</th>
                <th className="text-left px-3 py-2 text-white/40 font-medium w-16">Gate</th>
                <th className="text-left px-3 py-2 text-white/40 font-medium w-16">상태</th>
                <th className="text-left px-3 py-2 text-white/40 font-medium w-12">YMYL</th>
                <th className="text-left px-3 py-2 text-white/40 font-medium w-16">레이어</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.map(signal => (
                <tr key={signal.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-3 py-2 text-white/80 max-w-xs truncate">{signal.query}</td>
                  <td className="px-3 py-2">
                    <span className="font-mono text-violet-300">{signal.cps_score?.toFixed(2) || "—"}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${gateColor(signal.gate_status || "")}`}>
                      {signal.gate_status || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${statusColor(signal.status)}`}>
                      {signal.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {signal.is_ymyl ? <span className="text-red-400">⚠</span> : <span className="text-white/20">—</span>}
                  </td>
                  <td className="px-3 py-2 text-white/30">{signal.panel_layer?.replace("_", " ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && (
            <div className="text-center py-8 text-white/30 text-sm">질문 시그널이 없습니다.</div>
          )}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 탭3: 시그널 클러스터
// ─────────────────────────────────────────────────────────
function ClustersTab({ workspaceSlug }: { workspaceSlug: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getSignalClustersAction(workspaceSlug, 30).then(d => { setData(d); setLoading(false); });
  }, [workspaceSlug]);

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-emerald-400" /></div>
      ) : data.length === 0 ? (
        <EmptyState icon={Layers} message="클러스터가 없습니다. S-OGDE 파이프라인을 실행하면 자동 생성됩니다." />
      ) : data.map(cluster => (
        <div key={cluster.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-white/80 font-medium">{cluster.representative_question}</p>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs">
                {cluster.signal_count}개 변형
              </span>
            </div>
          </div>
          {cluster.dominant_intents && cluster.dominant_intents.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {cluster.dominant_intents.map((intent: string) => (
                <span key={intent} className="px-1.5 py-0.5 rounded bg-white/5 text-white/40 text-[10px]">{intent}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 탭4: Canonical Questions
// ─────────────────────────────────────────────────────────
function CanonicalQuestionsTab({ workspaceSlug }: { workspaceSlug: string }) {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getCanonicalQuestionsAction(workspaceSlug, page, 20);
    setData(res.data);
    setTotal(res.total);
    setLoading(false);
  }, [workspaceSlug, page]);

  useEffect(() => { load(); }, [load]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleExport = async () => {
    setExporting(true);
    const csv = await exportCanonicalQuestionsCsvAction(workspaceSlug);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `canonical_questions_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    setExporting(false);
  };

  const riskColor = (r: string) => {
    if (r === "high") return "text-red-400";
    if (r === "medium") return "text-amber-400";
    return "text-emerald-400";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <StatCard label="전체 CQ" value={total} color="amber" icon={BookOpen} />
        <button onClick={handleExport} disabled={exporting}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 hover:bg-amber-500/20">
          {exporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
          CSV 내보내기
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-amber-400" /></div>
      ) : data.length === 0 ? (
        <EmptyState icon={BookOpen} message="정규 질문이 없습니다. 파이프라인 Phase 3 승격을 실행하세요." />
      ) : (
        <div className="space-y-2">
          {data.map(cq => (
            <div key={cq.id} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/15 transition-all group">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/85 font-medium">{cq.normalized_question}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-white/40">{cq.primary_intent}</span>
                    <span className={`text-xs font-medium ${riskColor(cq.risk_level)}`}>
                      위험: {cq.risk_level}
                    </span>
                    <span className="text-xs font-mono text-amber-300">CPS {cq.cps_score?.toFixed(2)}</span>
                    {cq.variants && cq.variants.length > 0 && (
                      <span className="text-xs text-white/30">{cq.variants.length}개 변형</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(cq.normalized_question, cq.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-all"
                >
                  {copied === cq.id ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/40" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={Math.ceil(total / 20)} onPage={setPage} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 탭5: QIS Scenes
// ─────────────────────────────────────────────────────────
function QisScenesTab({ workspaceSlug }: { workspaceSlug: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    getQisScenesAction(workspaceSlug, 20).then(d => { setData(d); setLoading(false); });
  }, [workspaceSlug]);

  const readinessColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 50) return "text-amber-400";
    return "text-red-400";
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const csv = await exportQisScenesCsvAction(workspaceSlug);
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qis_scenes_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* CSV 다운로드 버튼 */}
      {data.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/15 border border-pink-500/30 text-pink-400 text-xs font-medium hover:bg-pink-500/25 transition-colors disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            QIS Scene CSV 내보내기
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-pink-400" /></div>
      ) : data.length === 0 ? (
        <EmptyState icon={Film} message="QIS Scene이 없습니다. 파이프라인 Phase 3를 실행하세요." />
      ) : data.map(scene => (
        <div key={scene.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-start justify-between gap-3 mb-2">
            <p className="text-sm font-medium text-white/85">{scene.scene_name}</p>
            <span className={`text-sm font-bold ${readinessColor(scene.readiness_score || 0)}`}>
              {scene.readiness_score || 0}%
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className={`px-1.5 py-0.5 rounded ${
              scene.risk_level === "high" ? "bg-red-500/15 text-red-400" :
              scene.risk_level === "medium" ? "bg-amber-500/15 text-amber-400" :
              "bg-emerald-500/15 text-emerald-400"
            }`}>
              위험 {scene.risk_level}
            </span>
          </div>
          {scene.must_do && scene.must_do.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] text-white/30 mb-1">Must Do</p>
              <div className="flex flex-wrap gap-1">
                {scene.must_do.slice(0, 3).map((item: string, i: number) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 탭6: 실행 이력
// ─────────────────────────────────────────────────────────
function RunsTab({ workspaceSlug, selectedDomain }: { workspaceSlug: string; selectedDomain: string }) {
  const [runs, setRuns] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailPkg, setDetailPkg] = useState<{ pkg: any; questions: any[] } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [r, p] = await Promise.all([
      getPipelineRunsAction(workspaceSlug, selectedDomain, 20),
      getSupplyPackagesAction(workspaceSlug, selectedDomain),
    ]);
    setRuns(r);
    setPackages(p);
    setLoading(false);
  }, [workspaceSlug, selectedDomain]);

  useEffect(() => { load(); }, [load]);

  const statusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    if (status === "failed") return <XCircle className="w-4 h-4 text-red-400" />;
    if (status === "running") return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
    return <Clock className="w-4 h-4 text-white/40" />;
  };

  const handleViewPackageDetail = async (packageId: string) => {
    setLoadingDetail(true);
    try {
      const detail = await getSupplyPackageDetailAction(workspaceSlug, packageId);
      setDetailPkg(detail);
    } catch (err) {
      console.error('Failed to load package detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 패키지 상세 모달 */}
      {detailPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDetailPkg(null)}>
          <div className="bg-[#1a1b1f] border border-white/10 rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-400" />
                공급 패키지 상세
              </h3>
              <button onClick={() => setDetailPkg(null)} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>
            {detailPkg.pkg && (
              <div className="mb-4 flex items-center gap-3 text-xs text-white/60">
                <span>{detailPkg.pkg.domain_key}</span>
                <span>/</span>
                <span className="font-medium text-white/80">{detailPkg.pkg.brand_slug || '공통 (전체 브랜드)'}</span>
                <span className={`ml-auto px-2 py-0.5 rounded ${
                  detailPkg.pkg.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'
                }`}>{detailPkg.pkg.status}</span>
              </div>
            )}
            {detailPkg.questions.length === 0 ? (
              <p className="text-xs text-white/30 py-4 text-center">포함된 정규 질문이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] text-white/30 uppercase tracking-wider">포함된 정규 질문 ({detailPkg.questions.length}개)</p>
                {detailPkg.questions.map((q: any) => (
                  <div key={q.id} className="bg-white/5 rounded-lg p-3 border border-white/5">
                    <p className="text-sm text-white/80">{q.normalized_question}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400">
                        {q.primary_intent}
                      </span>
                      <span className="text-[10px] text-white/30">CPS: {q.cps_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 공급 패키지 */}
      {packages.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-400" />
            질문 공급 패키지
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {packages.map(pkg => (
              <div key={pkg.id} className="bg-white/5 rounded-xl p-4 border border-white/10 group hover:border-blue-500/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium">{pkg.domain_key} / {pkg.brand_slug || "전체"}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    pkg.status === "ready" ? "bg-emerald-500/20 text-emerald-400" :
                    pkg.status === "delivered" ? "bg-blue-500/20 text-blue-400" :
                    "bg-white/5 text-white/30"
                  }`}>{pkg.status}</span>
                </div>
                <div className="text-2xl font-bold text-white">{pkg.cq_count}</div>
                <div className="text-xs text-white/30 mt-1">정규 질문 포함</div>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-white/20">{new Date(pkg.created_at).toLocaleDateString("ko-KR")}</div>
                  <button
                    onClick={() => handleViewPackageDetail(pkg.id)}
                    disabled={loadingDetail}
                    className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    {loadingDetail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                    상세 보기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 실행 이력 */}
      <div>
        <h3 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          최근 실행 이력
        </h3>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-blue-400" /></div>
        ) : runs.length === 0 ? (
          <EmptyState icon={Database} message="실행 이력이 없습니다." />
        ) : (
          <div className="space-y-2">
            {runs.map(run => (
              <div key={run.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  {statusIcon(run.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{run.pipeline_type}</span>
                      <span className="text-xs text-white/30">{run.domain_key}</span>
                      {run.brand_slug && <span className="text-xs text-white/30">/ {run.brand_slug}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-white/30">
                        {new Date(run.started_at).toLocaleString("ko-KR")}
                      </span>
                      {run.duration_ms && (
                        <span className="text-xs text-white/30">{(run.duration_ms / 1000).toFixed(1)}초</span>
                      )}
                    </div>
                  </div>
                  {run.result_summary && (
                    <div className="text-xs text-right text-white/40">
                      {Object.entries(run.result_summary as Record<string, unknown>).slice(0, 2).map(([k, v]) => (
                        <div key={k}>{k}: {String(v)}</div>
                      ))}
                    </div>
                  )}
                </div>
                {run.error_message && (
                  <div className="mt-2 text-xs text-red-400 bg-red-500/10 rounded p-2">{run.error_message}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 공용 컴포넌트
// ─────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon: Icon }: {
  label: string; value: number; color: string; icon: React.ElementType;
}) {
  const colorMap: Record<string, string> = {
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    pink: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  };
  const cls = colorMap[color] || colorMap.violet;

  return (
    <div className={`rounded-xl p-4 border ${cls.split(" ").slice(1).join(" ")}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 ${cls.split(" ")[0]}`} />
        <span className="text-xs text-white/40">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${cls.split(" ")[0]}`}>{value.toLocaleString()}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="w-8 h-8 text-white/15 mb-3" />
      <p className="text-sm text-white/30">{message}</p>
    </div>
  );
}

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2">
      <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
        className="p-1.5 rounded-lg bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-xs text-white/40">{page} / {totalPages}</span>
      <button onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        className="p-1.5 rounded-lg bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 탭7: 역방향 피드백 수집 및 이력
// ─────────────────────────────────────────────────────────
function FeedbackTab({ workspaceSlug, selectedDomain }: { workspaceSlug: string; selectedDomain: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHubFeedbackLogsAction(workspaceSlug);
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePullFeedback = async () => {
    setSyncing(true);
    setResult(null);
    try {
      const res = await triggerManualFeedbackPullAction(workspaceSlug, selectedDomain);
      if (res.ok) {
        setResult({
          success: true,
          newSignals: res.data?.newSignals ?? 0,
          cpsUpdated: res.data?.cpsUpdated ?? 0,
        });
        load();
      } else {
        setResult({
          success: false,
          error: res.error || "수집 실패",
        });
      }
    } catch (e: any) {
      setResult({
        success: false,
        error: e.message,
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 액션 패널 */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/10 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-500" />
            AI Hub 역방향 피드백 수동 동기화
          </h3>
          <p className="text-xs text-white/40 mt-1">
            제주 AI Hub에서 수집된 최신 검색어 패턴과 CQ 조회수를 가져와서 질문자산에 반영합니다.
          </p>
        </div>

        <button
          onClick={handlePullFeedback}
          disabled={syncing}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium px-4 py-2 rounded-lg text-xs hover:from-amber-600 hover:to-orange-600 transition-colors disabled:opacity-50"
        >
          {syncing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              동기화 중...
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              피드백 즉시 수집
            </>
          )}
        </button>
      </div>

      {/* 결과 알림 배너 */}
      {result && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          result.success ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
          {result.success ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
          <div>
            <p className="text-xs font-semibold">{result.success ? "피드백 동기화 성공" : "피드백 동기화 실패"}</p>
            {result.success ? (
              <p className="text-[11px] text-white/60 mt-1">
                신규 시그널 {result.newSignals}건 수집 완료 / CQ 점수 {result.cpsUpdated}개 보정 완료
              </p>
            ) : (
              <p className="text-[11px] text-white/60 mt-1">{result.error}</p>
            )}
          </div>
        </div>
      )}

      {/* 동기화 이력 */}
      <div>
        <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">최근 피드백 이력</h4>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState icon={MessageSquare} message="피드백 동기화 이력이 없습니다." />
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{log.region.toUpperCase()} 리전</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                      log.source === "hub_push" ? "bg-cyan-500/20 text-cyan-400" : "bg-purple-500/20 text-purple-400"
                    }`}>
                      {log.source === "hub_push" ? "PUSH (자동)" : "PULL (수동)"}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      log.processed ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/30"
                    }`}>
                      {log.processed ? "처리됨" : "대기"}
                    </span>
                  </div>
                  <div className="text-[11px] text-white/30 mt-1 flex items-center gap-2">
                    <span>집계 일자: {log.feedback_date}</span>
                    <span>•</span>
                    <span>수집 시각: {new Date(log.created_at).toLocaleString("ko-KR")}</span>
                  </div>
                </div>

                {log.processed && log.process_result && (
                  <div className="text-xs text-right text-white/40">
                    <div>신규 시그널: {log.process_result.newSignals ?? 0}건</div>
                    <div>CQ 보정: {log.process_result.cpsUpdated ?? 0}건</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
