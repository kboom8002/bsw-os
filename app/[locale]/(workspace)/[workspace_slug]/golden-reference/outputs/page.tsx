"use client";

/**
 * app/[locale]/(workspace)/[workspace_slug]/golden-reference/outputs/page.tsx
 * 골든 레퍼런스 산출물 뷰어 + Hub 내보내기
 */

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Palette,
  Layers,
  BarChart2,
  FileText,
  ImageIcon,
  Award,
  Download,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

// ─── 탭 정의 ─────────────────────────────────────────────────

const TABS = [
  { key: "tokens", label: "Design Tokens", icon: Palette, color: "text-violet-400", accent: "from-violet-500/10 to-indigo-500/5 border-violet-500/20" },
  { key: "layouts", label: "Layouts", icon: Layers, color: "text-cyan-400", accent: "from-cyan-500/10 to-teal-500/5 border-cyan-500/20" },
  { key: "sections", label: "Sections", icon: BarChart2, color: "text-indigo-400", accent: "from-indigo-500/10 to-violet-500/5 border-indigo-500/20" },
  { key: "content", label: "Content", icon: FileText, color: "text-emerald-400", accent: "from-emerald-500/10 to-teal-500/5 border-emerald-500/20" },
  { key: "images", label: "Images", icon: ImageIcon, color: "text-yellow-400", accent: "from-yellow-500/10 to-amber-500/5 border-yellow-500/20" },
  { key: "quality", label: "Quality", icon: Award, color: "text-orange-400", accent: "from-orange-500/10 to-red-500/5 border-orange-500/20" },
];

const INDUSTRIES = [
  { key: "skincare", label: "스킨케어/뷰티", emoji: "💄" },
  { key: "wedding", label: "웨딩", emoji: "💍" },
  { key: "medical_clinic", label: "병원/클리닉", emoji: "🏥" },
  { key: "restaurant_cafe", label: "식당/카페", emoji: "☕" },
  { key: "hotel", label: "호텔/숙박", emoji: "🏨" },
  { key: "place_brand", label: "지역 브랜드", emoji: "🗺️" },
];

// ─── JSON 트리 뷰어 컴포넌트 ──────────────────────────────────

function JsonNode({ data, depth = 0, keyName }: { data: any; depth?: number; keyName?: string }) {
  const [open, setOpen] = useState(depth < 2);

  if (data === null || data === undefined) {
    return <span className="text-slate-600">null</span>;
  }
  if (typeof data === "boolean") {
    return <span className={data ? "text-emerald-400" : "text-red-400"}>{String(data)}</span>;
  }
  if (typeof data === "number") {
    return <span className="text-yellow-300">{data}</span>;
  }
  if (typeof data === "string") {
    if (data.startsWith("#") && data.length === 7) {
      return (
        <span className="text-green-300 font-mono">
          "{data}"
          <span className="inline-block w-3 h-3 rounded ml-1 mb-[-2px] border border-white/20" style={{ backgroundColor: data }} />
        </span>
      );
    }
    return <span className="text-green-300">"{data}"</span>;
  }

  const isArray = Array.isArray(data);
  const entries = isArray ? data.map((v: any, i: number) => [i, v]) : Object.entries(data);
  const preview = isArray ? `[${data.length}]` : `{${Object.keys(data).length}}`;

  if (entries.length === 0) {
    return <span className="text-slate-500">{isArray ? "[]" : "{}"}</span>;
  }

  return (
    <span>
      <button
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-0.5 text-slate-400 hover:text-white"
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <span className="text-slate-500 text-xs">{preview}</span>
      </button>
      {open && (
        <span className="block pl-4 border-l border-white/5 mt-0.5 space-y-0.5">
          {entries.slice(0, 50).map((entry: any[]) => {
            const k = entry[0];
            const v = entry[1];
            return (
              <span key={k} className="block">
                <span className="text-slate-400">{isArray ? "" : `"${k}": `}</span>
                <JsonNode data={v} depth={depth + 1} keyName={String(k)} />
              </span>
            );
          })}

          {entries.length > 50 && (
            <span className="text-slate-600 text-xs">... {entries.length - 50}개 더</span>
          )}
        </span>
      )}
    </span>
  );
}

// ─── 토큰 비주얼 렌더러 ───────────────────────────────────────

function TokensVisualizer({ data }: { data: any }) {
  if (!data) return null;

  const colors = data.consensus?.color;
  const typography = data.consensus?.typography;
  const shape = data.consensus?.shape;

  return (
    <div className="space-y-5">
      {/* 색상 합의 */}
      {colors && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Palette className="w-4 h-4 text-violet-400" />
            색상 합의
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {colors.clusters?.map((cluster: any, i: number) => (
              <div key={i} className="bg-slate-800/60 rounded-xl p-3 space-y-2">
                <div className="text-xs text-slate-400 capitalize font-medium">{cluster.positioning}</div>
                <div className="flex gap-1">
                  {[cluster.primary, cluster.bg, cluster.text, cluster.accent].filter(Boolean).map((c: string, j: number) => (
                    <div
                      key={j}
                      className="w-6 h-6 rounded-lg border border-white/10"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
                <div className="text-xs text-slate-500">{cluster.sampleCount ?? 0}개 사이트</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 폰트 페어링 */}
      {typography?.topPairs && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">타이포그래피 합의 (Top 3 페어링)</h3>
          <div className="space-y-2">
            {typography.topPairs.slice(0, 3).map((pair: any, i: number) => (
              <div key={i} className="flex items-center gap-3 bg-slate-800/60 rounded-xl px-4 py-3">
                <span className="text-xs text-slate-500 w-4">#{i + 1}</span>
                <div className="flex-1">
                  <span className="text-white text-sm" style={{ fontFamily: pair.headingFamily }}>
                    {pair.headingFamily}
                  </span>
                  <span className="text-slate-500 mx-2">×</span>
                  <span className="text-slate-300 text-sm" style={{ fontFamily: pair.bodyFamily }}>
                    {pair.bodyFamily}
                  </span>
                </div>
                <span className="text-xs text-slate-500">{Math.round((pair.frequency ?? 0) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shape */}
      {shape && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Border Radius 합의</h3>
          <div className="flex gap-3">
            {shape.primaryRadius?.distribution?.slice(0, 5).map((r: any, i: number) => (
              <div
                key={i}
                className="w-16 h-16 bg-violet-500/20 border border-violet-500/30 flex items-center justify-center"
                style={{ borderRadius: r.value }}
                title={`${r.value} (${r.frequency}회)`}
              >
                <span className="text-xs text-violet-300">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 섹션 시퀀스 비주얼 ───────────────────────────────────────

const PSYCHOLOGY_COLORS: Record<string, string> = {
  attention: "bg-red-500/20 text-red-300 border-red-500/30",
  value: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  proof: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  trust: "bg-green-500/20 text-green-300 border-green-500/30",
  action: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  delight: "bg-pink-500/20 text-pink-300 border-pink-500/30",
};

function SectionsVisualizer({ data }: { data: any }) {
  if (!data?.consensus?.sections) return null;
  const { topSequences, sectionFrequency, psychologyFlowConsensus } = data.consensus.sections;

  return (
    <div className="space-y-5">
      {/* 합의 심리 플로우 */}
      {psychologyFlowConsensus && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">합의 심리 플로우</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {psychologyFlowConsensus.map((layer: string, i: number) => (
              <div key={i} className="flex items-center gap-1">
                <span className={`px-3 py-1 rounded-lg text-xs border ${PSYCHOLOGY_COLORS[layer] ?? "bg-slate-800 text-slate-400 border-slate-700"}`}>
                  {i + 1}. {layer}
                </span>
                {i < psychologyFlowConsensus.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 섹션 빈도 */}
      {sectionFrequency && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">섹션 출현 빈도</h3>
          <div className="space-y-2">
            {Object.entries(sectionFrequency)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 10)
              .map(([type, freq]) => (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-40 truncate">{type}</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                      style={{ width: `${Math.round((freq as number) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-10 text-right">
                    {Math.round((freq as number) * 100)}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

export default function GoldenOutputsPage() {
  const params = useParams();
  const [selectedIndustry, setSelectedIndustry] = useState("skincare");
  const [selectedTab, setSelectedTab] = useState("tokens");
  const [outputs, setOutputs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [sampleCount, setSampleCount] = useState(0);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"visual" | "json">("visual");

  const fetchOutputs = useCallback(async (industry: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/golden/consensus?subIndustryKey=${industry}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.outputs) {
          setOutputs(data.outputs);
          setSampleCount(data.sampleCount ?? 0);
          setGeneratedAt(data.generatedAt);
        } else {
          setOutputs({});
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOutputs(selectedIndustry);
  }, [selectedIndustry, fetchOutputs]);

  const handleCopyJson = async () => {
    const currentOutput = outputs[selectedTab];
    if (!currentOutput) return;
    await navigator.clipboard.writeText(JSON.stringify(currentOutput, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentOutput = outputs[selectedTab];
  const currentTab = TABS.find(t => t.key === selectedTab) ?? TABS[0];

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">산출물 뷰어</h1>
          <p className="text-sm text-slate-400">
            {sampleCount > 0 && `${sampleCount}개 사이트 분석 기반`}
            {generatedAt && ` · 생성: ${new Date(generatedAt).toLocaleDateString("ko-KR")}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 뷰 모드 토글 */}
          <div className="flex bg-slate-900 rounded-xl border border-white/10 p-0.5">
            {(["visual", "json"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === mode
                    ? "bg-white/10 text-white"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                {mode === "visual" ? "✨ 비주얼" : "{ } JSON"}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchOutputs(selectedIndustry)}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 업종 선택 */}
      <div className="flex flex-wrap gap-2">
        {INDUSTRIES.map(ind => (
          <button
            key={ind.key}
            onClick={() => setSelectedIndustry(ind.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
              selectedIndustry === ind.key
                ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {ind.emoji} {ind.label}
          </button>
        ))}
      </div>

      {/* 산출물 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(({ key, label, icon: Icon, color }) => {
          const ready = key in outputs;
          return (
            <button
              key={key}
              onClick={() => setSelectedTab(key)}
              disabled={!ready}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${
                selectedTab === key && ready
                  ? `bg-gradient-to-r ${currentTab.accent} text-white`
                  : ready
                  ? "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                  : "bg-slate-900/40 border-white/5 text-slate-600 cursor-not-allowed"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${ready ? color : "text-slate-600"}`} />
              {label}
              {!ready && <span className="text-xs text-slate-700">—</span>}
            </button>
          );
        })}
      </div>

      {/* 내용 영역 */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        </div>
      ) : Object.keys(outputs).length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-slate-600" />
          </div>
          <div>
            <p className="text-white font-medium">아직 산출물이 없습니다</p>
            <p className="text-slate-500 text-sm mt-1">
              대시보드에서 배치 분석 후 패턴 합의를 실행하면 여기에 산출물이 생성됩니다.
            </p>
          </div>
        </div>
      ) : !currentOutput ? (
        <div className="flex items-center gap-3 p-5 bg-slate-800/40 border border-yellow-500/20 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <p className="text-yellow-300 text-sm">이 산출물은 아직 생성되지 않았습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 툴바 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <currentTab.icon className={`w-4 h-4 ${currentTab.color}`} />
              <span className="text-sm font-medium text-white">{currentTab.label}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs transition-all border border-white/10"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "복사됨!" : "JSON 복사"}
              </button>
              <a
                href={`/api/golden/export?subIndustryKey=${selectedIndustry}&deliverable=${selectedTab}`}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 text-xs transition-all border border-violet-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                다운로드
              </a>
            </div>
          </div>

          {/* 비주얼 / JSON 뷰 */}
          {viewMode === "visual" ? (
            <div className={`p-5 rounded-2xl border bg-gradient-to-br ${currentTab.accent}`}>
              {selectedTab === "tokens" && <TokensVisualizer data={currentOutput} />}
              {selectedTab === "sections" && <SectionsVisualizer data={currentOutput} />}
              {!["tokens", "sections"].includes(selectedTab) && (
                <div className="text-slate-400 text-sm">
                  <p className="mb-2 text-white font-medium">데이터 구조 미리보기</p>
                  <div className="font-mono text-xs leading-relaxed bg-slate-950/60 rounded-xl p-4 overflow-auto max-h-96">
                    <JsonNode data={currentOutput} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 overflow-auto max-h-[600px]">
              <pre className="font-mono text-xs text-green-300 leading-relaxed whitespace-pre-wrap">
                {JSON.stringify(currentOutput, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
